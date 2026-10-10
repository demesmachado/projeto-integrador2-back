import { LIMITES, STATUS_CONSULTA } from '../config/constantes.js';
import * as consultaRepositorio from '../repositorios/consulta.repositorio.js';
import * as profissionalRepositorio from '../repositorios/profissional.repositorio.js';
import {
  serializarConsultaParaPaciente,
  serializarHorarioDisponivel
} from '../serializadores/consulta.serializador.js';
import { serializarProfissionalResumo } from '../serializadores/profissional.serializador.js';
import { decifrarJson } from '../utilitarios/cifra.js';
import { contextoCifra } from '../utilitarios/contextoCifra.js';
import { hojeISO, isoParaData } from '../utilitarios/datas.js';
import { conflito, naoEncontrado, regraDeNegocio } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';

/**
 * Visão do paciente sobre a agenda: ver os horários livres do seu profissional, solicitar, acompanhar,
 * desistir de uma solicitação e consultar o histórico das consultas realizadas.
 */

const decifrarDadosClinicos = (consulta) =>
  decifrarJson(consulta.dadosClinicosCifrados, contextoCifra.consulta(consulta.id));

const MENSAGEM_SEM_PROFISSIONAL =
  'Você ainda não possui um profissional vinculado. Procure a administração da sua organização.';

const hojeComoData = () => isoParaData(hojeISO());

/** Horários livres do profissional responsável (a partir de hoje). */
export async function listarDisponiveis(paciente, consulta) {
  if (!paciente.profissionalId) return { ...respostaPaginada([], 0, consulta), profissional: null };

  const filtros = { profissionalId: paciente.profissionalId, hoje: hojeComoData() };
  const [itens, total, profissional] = await Promise.all([
    consultaRepositorio.listarDisponiveis({ ...filtros, ...calcularDeslocamento(consulta) }),
    consultaRepositorio.contarDisponiveis(filtros),
    profissionalRepositorio.buscarPorId(paciente.profissionalId)
  ]);

  return {
    ...respostaPaginada(itens.map(serializarHorarioDisponivel), total, consulta),
    profissional: serializarProfissionalResumo(profissional)
  };
}

export async function listarMinhas(paciente, consulta) {
  const filtros = { pacienteId: paciente.id, status: consulta.status };
  const [itens, total] = await Promise.all([
    consultaRepositorio.listarDoPaciente({ ...filtros, ...calcularDeslocamento(consulta) }),
    consultaRepositorio.contarDoPaciente(filtros)
  ]);
  return respostaPaginada(itens.map((item) => serializarConsultaParaPaciente(item)), total, consulta);
}

/** Consultas realizadas, da mais recente para a mais antiga, com os dados clínicos decifrados. */
export async function listarHistorico(paciente, consulta) {
  const [itens, total] = await Promise.all([
    consultaRepositorio.listarRealizadasDoPaciente({ pacienteId: paciente.id, ...calcularDeslocamento(consulta) }),
    consultaRepositorio.contarRealizadasDoPaciente(paciente.id)
  ]);
  return respostaPaginada(
    itens.map((item) => serializarConsultaParaPaciente(item, decifrarDadosClinicos(item))),
    total,
    consulta
  );
}

/**
 * Solicita um horário livre do SEU profissional. A troca de status é atômica: se dois pacientes pedirem o
 * mesmo horário ao mesmo tempo, um recebe 409. Horário de outro profissional responde 404.
 */
export async function solicitar(paciente, id) {
  if (!paciente.profissionalId) throw regraDeNegocio(MENSAGEM_SEM_PROFISSIONAL);

  const hoje = hojeComoData();
  const emAberto = await consultaRepositorio.contarEmAbertoDoPaciente({ pacienteId: paciente.id, hoje });
  if (emAberto >= LIMITES.maxConsultasEmAbertoPorPaciente) {
    throw regraDeNegocio(
      `Você já tem ${LIMITES.maxConsultasEmAbertoPorPaciente} consultas em aberto. Aguarde a realização ou cancele alguma antes de solicitar outra.`
    );
  }

  const alterados = await consultaRepositorio.transicionar({
    where: {
      id,
      profissionalId: paciente.profissionalId,
      status: STATUS_CONSULTA.DISPONIVEL,
      pacienteId: null,
      data: { gte: hoje }
    },
    dados: { status: STATUS_CONSULTA.SOLICITADA, pacienteId: paciente.id }
  });

  if (alterados === 0) {
    const horario = await consultaRepositorio.buscarPorId(id);
    if (!horario || horario.profissionalId !== paciente.profissionalId) throw naoEncontrado('Horário não encontrado.');
    throw conflito('Este horário não está mais disponível.');
  }

  const consulta = await consultaRepositorio.buscarDoPaciente(id, paciente.id);
  return serializarConsultaParaPaciente(consulta);
}

/** Desistir de uma solicitação ainda não confirmada: o horário volta a ficar livre. */
export async function cancelarSolicitacao(paciente, id) {
  const alterados = await consultaRepositorio.transicionar({
    where: { id, pacienteId: paciente.id, status: STATUS_CONSULTA.SOLICITADA },
    dados: { status: STATUS_CONSULTA.DISPONIVEL, pacienteId: null }
  });

  if (alterados === 0) {
    const consulta = await consultaRepositorio.buscarDoPaciente(id, paciente.id);
    if (!consulta) throw naoEncontrado('Consulta não encontrada.');
    throw conflito(
      `Só é possível cancelar solicitações aguardando confirmação. Situação atual: "${consulta.status}". Para desmarcar uma consulta confirmada, fale com o profissional.`
    );
  }
}
