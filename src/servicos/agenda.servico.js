import { STATUS_CONSULTA, STATUS_EXCLUIVEIS } from '../config/constantes.js';
import * as consultaRepositorio from '../repositorios/consulta.repositorio.js';
import { serializarConsultaParaProfissional } from '../serializadores/consulta.serializador.js';
import { cifrarJson, decifrarJson } from '../utilitarios/cifra.js';
import { contextoCifra } from '../utilitarios/contextoCifra.js';
import { hojeISO, isoParaData } from '../utilitarios/datas.js';
import { conflito, naoEncontrado, regraDeNegocio } from '../utilitarios/erros.js';
import { calcularImc } from '../utilitarios/indicadores.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';

/**
 * Agenda do profissional: criar horários, confirmar/recusar solicitações, registrar a consulta realizada.
 *
 *   disponivel → solicitada (paciente) → confirmada | recusada (aqui) → realizada | cancelada (aqui)
 *
 * Cada mudança de status é um único UPDATE condicional ao status esperado (ver consulta.repositorio.js):
 * se outra requisição já mudou o horário, nada é alterado e a resposta é 409.
 */

const decifrarDadosClinicos = (consulta) =>
  decifrarJson(consulta.dadosClinicosCifrados, contextoCifra.consulta(consulta.id));

/** Quando a troca atômica não alterou nada: o horário não existe (404) ou estava em outro status (409). */
async function explicarFalha(profissionalId, id, mensagem) {
  const existente = await consultaRepositorio.buscarDoProfissional(id, profissionalId);
  if (!existente) throw naoEncontrado('Horário não encontrado.');
  throw conflito(`${mensagem} Situação atual do horário: "${existente.status}".`);
}

export async function listar(profissional, consulta) {
  const filtros = {
    profissionalId: profissional.id,
    status: consulta.status,
    busca: consulta.busca,
    de: consulta.de ? isoParaData(consulta.de) : undefined,
    ate: consulta.ate ? isoParaData(consulta.ate) : undefined
  };
  const [itens, total] = await Promise.all([
    consultaRepositorio.listarDoProfissional({ ...filtros, ...calcularDeslocamento(consulta) }),
    consultaRepositorio.contarDoProfissional(filtros)
  ]);
  return respostaPaginada(itens.map((item) => serializarConsultaParaProfissional(item)), total, consulta);
}

/** Detalhe do horário. Se a consulta foi realizada, inclui os dados clínicos decifrados. */
export async function obter(profissional, id) {
  const consulta = await consultaRepositorio.buscarDoProfissional(id, profissional.id);
  if (!consulta) throw naoEncontrado('Horário não encontrado.');
  const dados = consulta.status === STATUS_CONSULTA.REALIZADA ? decifrarDadosClinicos(consulta) : undefined;
  return serializarConsultaParaProfissional(consulta, dados);
}

export async function criarHorario(profissional, { data, hora }) {
  if (data < hojeISO()) throw regraDeNegocio('Não é possível criar horários em datas que já passaram.');

  try {
    const consulta = await consultaRepositorio.criarHorario({
      profissionalId: profissional.id,
      data: isoParaData(data),
      hora
    });
    return serializarConsultaParaProfissional(consulta);
  } catch (erro) {
    if (erro?.code === 'P2002') {
      throw conflito(`Você já tem um horário em ${data} às ${hora}.`);
    }
    throw erro;
  }
}

async function transitar(profissional, id, { de, para, mensagem }) {
  const alterados = await consultaRepositorio.transicionar({
    where: { id, profissionalId: profissional.id, status: de },
    dados: { status: para }
  });
  if (alterados === 0) await explicarFalha(profissional.id, id, mensagem);
  return obter(profissional, id);
}

export const confirmar = (profissional, id) =>
  transitar(profissional, id, {
    de: STATUS_CONSULTA.SOLICITADA,
    para: STATUS_CONSULTA.CONFIRMADA,
    mensagem: 'Só é possível confirmar solicitações aguardando confirmação.'
  });

export const recusar = (profissional, id) =>
  transitar(profissional, id, {
    de: STATUS_CONSULTA.SOLICITADA,
    para: STATUS_CONSULTA.RECUSADA,
    mensagem: 'Só é possível recusar solicitações aguardando confirmação.'
  });

export const cancelar = (profissional, id) =>
  transitar(profissional, id, {
    de: STATUS_CONSULTA.CONFIRMADA,
    para: STATUS_CONSULTA.CANCELADA,
    mensagem: 'Só é possível cancelar consultas confirmadas.'
  });

/**
 * Registra o atendimento: grava os dados clínicos (todos opcionais) criptografados e marca como realizada.
 * O IMC é sempre calculado aqui (peso ÷ altura²); o valor enviado pelo cliente, se houver, é ignorado.
 */
export async function registrar(profissional, id, dados) {
  const clinicos = {
    peso: dados.peso ?? null,
    altura: dados.altura ?? null,
    imc: calcularImc(dados.peso, dados.altura),
    pressaoArterial: dados.pressaoArterial ?? null,
    frequenciaCardiaca: dados.frequenciaCardiaca ?? null,
    glicemia: dados.glicemia ?? null,
    habitosSono: dados.habitosSono ?? null,
    atividadeFisica: dados.atividadeFisica ?? null,
    alimentacao: dados.alimentacao ?? null,
    observacoes: dados.observacoes ?? null
  };

  const alterados = await consultaRepositorio.transicionar({
    where: { id, profissionalId: profissional.id, status: STATUS_CONSULTA.CONFIRMADA },
    dados: {
      status: STATUS_CONSULTA.REALIZADA,
      dadosClinicosCifrados: cifrarJson(clinicos, contextoCifra.consulta(id)),
      realizadaEm: new Date()
    }
  });
  if (alterados === 0) await explicarFalha(profissional.id, id, 'Só é possível registrar consultas confirmadas.');

  const consulta = await consultaRepositorio.buscarDoProfissional(id, profissional.id);
  return serializarConsultaParaProfissional(consulta, clinicos);
}

/** Exclui horários livres, recusados ou cancelados. Consultas em andamento ou realizadas são preservadas. */
export async function excluir(profissional, id) {
  const excluidos = await consultaRepositorio.excluirSe({
    id,
    profissionalId: profissional.id,
    statusPermitidos: STATUS_EXCLUIVEIS
  });
  if (excluidos === 0) {
    await explicarFalha(profissional.id, id, 'Só é possível excluir horários disponíveis, recusados ou cancelados.');
  }
}
