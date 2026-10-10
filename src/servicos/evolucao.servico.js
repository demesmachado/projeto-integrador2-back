import { randomUUID } from 'node:crypto';
import * as consultaRepositorio from '../repositorios/consulta.repositorio.js';
import * as evolucaoRepositorio from '../repositorios/evolucao.repositorio.js';
import { serializarConsultaParaPaciente } from '../serializadores/consulta.serializador.js';
import { serializarEvolucao } from '../serializadores/evolucao.serializador.js';
import { cifrarJson, decifrarJson } from '../utilitarios/cifra.js';
import { contextoCifra } from '../utilitarios/contextoCifra.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { exigirPacienteAcessivel } from './acesso.servico.js';

/**
 * Parte clínica da ficha do paciente (histórico de consultas e evolução), restrita ao profissional
 * responsável. Nem o administrador da organização acessa estes dados.
 */

const decifrarEvolucao = (evolucao) => decifrarJson(evolucao.dadosCifrados, contextoCifra.evolucao(evolucao.id));

const decifrarDadosClinicos = (consulta) =>
  decifrarJson(consulta.dadosClinicosCifrados, contextoCifra.consulta(consulta.id));

export async function listar(profissional, pacienteId, consulta) {
  await exigirPacienteAcessivel(profissional, pacienteId);
  const [itens, total] = await Promise.all([
    evolucaoRepositorio.listarDoPaciente({ pacienteId, ...calcularDeslocamento(consulta) }),
    evolucaoRepositorio.contarDoPaciente(pacienteId)
  ]);
  return respostaPaginada(itens.map((item) => serializarEvolucao(item, decifrarEvolucao(item))), total, consulta);
}

/** Notas de evolução não podem ser editadas nem apagadas: ficam como registro clínico. */
export async function criar(profissional, pacienteId, { indicadorBemEstar, texto }) {
  await exigirPacienteAcessivel(profissional, pacienteId);

  const id = randomUUID(); // faz parte do contexto da criptografia
  const evolucao = await evolucaoRepositorio.criar({
    id,
    pacienteId,
    profissionalId: profissional.id,
    dadosCifrados: cifrarJson({ texto, indicadorBemEstar }, contextoCifra.evolucao(id))
  });
  return serializarEvolucao(evolucao, { texto, indicadorBemEstar });
}

/** Histórico de consultas realizadas do paciente, com os dados clínicos decifrados. */
export async function listarHistoricoDeConsultas(profissional, pacienteId, consulta) {
  await exigirPacienteAcessivel(profissional, pacienteId);
  const [itens, total] = await Promise.all([
    consultaRepositorio.listarRealizadasDoPaciente({ pacienteId, ...calcularDeslocamento(consulta) }),
    consultaRepositorio.contarRealizadasDoPaciente(pacienteId)
  ]);
  return respostaPaginada(
    itens.map((item) => serializarConsultaParaPaciente(item, decifrarDadosClinicos(item))),
    total,
    consulta
  );
}
