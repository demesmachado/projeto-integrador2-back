import { randomUUID } from 'node:crypto';
import * as notificacaoRepositorio from '../repositorios/notificacao.repositorio.js';
import { serializarNotificacao } from '../serializadores/notificacao.serializador.js';
import { cifrarJson, decifrarJson } from '../utilitarios/cifra.js';
import { contextoCifra } from '../utilitarios/contextoCifra.js';
import { naoEncontrado } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { exigirPacienteAcessivel } from './acesso.servico.js';

/**
 * Notificações (medicamentos, avisos de consulta, indicadores de bem-estar).
 * O profissional envia para os SEUS pacientes; o paciente só lê as suas. Título e mensagem ficam cifrados.
 */

const decifrarConteudo = (notificacao) =>
  decifrarJson(notificacao.conteudoCifrado, contextoCifra.notificacao(notificacao.id));

const converter = (notificacao) => serializarNotificacao(notificacao, decifrarConteudo(notificacao));

// ---------------------------------------------------------------------------------------------------------
// Profissional
// ---------------------------------------------------------------------------------------------------------

export async function listarEnviadas(profissional, consulta) {
  const filtros = { profissionalId: profissional.id, pacienteId: consulta.pacienteId, tipo: consulta.tipo };
  const [itens, total] = await Promise.all([
    notificacaoRepositorio.listarDoProfissional({ ...filtros, ...calcularDeslocamento(consulta) }),
    notificacaoRepositorio.contarDoProfissional(filtros)
  ]);
  return respostaPaginada(itens.map(converter), total, consulta);
}

export async function enviar(profissional, { pacienteId, tipo, titulo, mensagem }) {
  await exigirPacienteAcessivel(profissional, pacienteId);

  const id = randomUUID(); // faz parte do contexto da criptografia
  const notificacao = await notificacaoRepositorio.criar({
    id,
    pacienteId,
    profissionalId: profissional.id,
    tipo,
    conteudoCifrado: cifrarJson({ titulo, mensagem }, contextoCifra.notificacao(id))
  });
  return serializarNotificacao(notificacao, { titulo, mensagem });
}

export async function corrigir(profissional, id, { tipo, titulo, mensagem }) {
  const atual = await notificacaoRepositorio.buscarDoProfissional(id, profissional.id);
  if (!atual) throw naoEncontrado('Notificação não encontrada.');

  const notificacao = await notificacaoRepositorio.atualizar(id, {
    tipo,
    conteudoCifrado: cifrarJson({ titulo, mensagem }, contextoCifra.notificacao(id))
  });
  return serializarNotificacao(notificacao, { titulo, mensagem });
}

export async function excluir(profissional, id) {
  const atual = await notificacaoRepositorio.buscarDoProfissional(id, profissional.id);
  if (!atual) throw naoEncontrado('Notificação não encontrada.');
  await notificacaoRepositorio.excluir(id);
}

// ---------------------------------------------------------------------------------------------------------
// Paciente
// ---------------------------------------------------------------------------------------------------------

export async function listarMinhas(paciente, consulta) {
  const filtros = { pacienteId: paciente.id, apenasNaoLidas: consulta.apenasNaoLidas };
  const [itens, total] = await Promise.all([
    notificacaoRepositorio.listarDoPaciente({ ...filtros, ...calcularDeslocamento(consulta) }),
    notificacaoRepositorio.contarDoPaciente(filtros)
  ]);
  return respostaPaginada(itens.map(converter), total, consulta);
}

export async function contarNaoLidas(paciente) {
  return { naoLidas: await notificacaoRepositorio.contarDoPaciente({ pacienteId: paciente.id, apenasNaoLidas: true }) };
}

/** Idempotente: marcar de novo uma notificação já lida não é erro. */
export async function marcarComoLida(paciente, id) {
  const notificacao = await notificacaoRepositorio.buscarDoPaciente(id, paciente.id);
  if (!notificacao) throw naoEncontrado('Notificação não encontrada.');
  await notificacaoRepositorio.marcarComoLida(id, paciente.id);
}

export async function marcarTodasComoLidas(paciente) {
  return { marcadas: await notificacaoRepositorio.marcarTodasComoLidas(paciente.id) };
}
