import * as conteudoRepositorio from '../repositorios/conteudo.repositorio.js';
import { serializarConteudo, serializarRecomendacao } from '../serializadores/conteudo.serializador.js';
import { conflito, naoEncontrado, proibido } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { exigirPacienteAcessivel } from './acesso.servico.js';

/**
 * Biblioteca de conteúdos e recomendações aos pacientes.
 * Conteúdos globais do sistema são visíveis a todos e imutáveis; os criados por um profissional ficam
 * visíveis para a organização dele, mas só o autor edita ou exclui.
 */

async function exigirConteudoVisivel(profissional, id) {
  const conteudo = await conteudoRepositorio.buscarVisivel(id, profissional.organizacaoId);
  if (!conteudo) throw naoEncontrado('Conteúdo não encontrado.');
  return conteudo;
}

async function exigirConteudoDoAutor(profissional, id) {
  const conteudo = await exigirConteudoVisivel(profissional, id);
  if (conteudo.criadoPorId !== profissional.id) {
    throw proibido('Somente o autor pode alterar ou excluir este conteúdo.');
  }
  return conteudo;
}

// ---------------------------------------------------------------------------------------------------------
// Biblioteca (profissional)
// ---------------------------------------------------------------------------------------------------------

export async function listar(profissional, consulta) {
  const filtros = { organizacaoId: profissional.organizacaoId, tipo: consulta.tipo, busca: consulta.busca };
  const [itens, total] = await Promise.all([
    conteudoRepositorio.listar({ ...filtros, ...calcularDeslocamento(consulta) }),
    conteudoRepositorio.contar(filtros)
  ]);
  return respostaPaginada(itens.map((item) => serializarConteudo(item, profissional)), total, consulta);
}

export async function criar(profissional, { titulo, tipo, descricao, url }) {
  const conteudo = await conteudoRepositorio.criar({
    organizacaoId: profissional.organizacaoId,
    criadoPorId: profissional.id,
    titulo,
    tipo,
    descricao,
    url: url ?? null
  });
  return serializarConteudo(conteudo, profissional);
}

export async function atualizar(profissional, id, { titulo, tipo, descricao, url }) {
  await exigirConteudoDoAutor(profissional, id);
  const conteudo = await conteudoRepositorio.atualizar(id, { titulo, tipo, descricao, url });
  return serializarConteudo(conteudo, profissional);
}

/** As recomendações já feitas a pacientes com este conteúdo saem junto. */
export async function excluir(profissional, id) {
  await exigirConteudoDoAutor(profissional, id);
  await conteudoRepositorio.excluir(id);
}

// ---------------------------------------------------------------------------------------------------------
// Recomendações na ficha do paciente (profissional)
// ---------------------------------------------------------------------------------------------------------

export async function listarRecomendacoes(profissional, pacienteId, consulta) {
  await exigirPacienteAcessivel(profissional, pacienteId);
  const [itens, total] = await Promise.all([
    conteudoRepositorio.listarRecomendacoesDoPaciente({ pacienteId, ...calcularDeslocamento(consulta) }),
    conteudoRepositorio.contarRecomendacoesDoPaciente(pacienteId)
  ]);
  return respostaPaginada(itens.map(serializarRecomendacao), total, consulta);
}

export async function recomendar(profissional, pacienteId, { conteudoId }) {
  await exigirPacienteAcessivel(profissional, pacienteId);
  await exigirConteudoVisivel(profissional, conteudoId);

  const jaRecomendado = await conteudoRepositorio.buscarRecomendacaoPorConteudo({ conteudoId, pacienteId });
  if (jaRecomendado) throw conflito('Este conteúdo já foi recomendado a este paciente.');

  try {
    const recomendacao = await conteudoRepositorio.criarRecomendacao({
      conteudoId,
      pacienteId,
      profissionalId: profissional.id
    });
    return serializarRecomendacao(recomendacao);
  } catch (erro) {
    // Duas recomendações simultâneas: o índice único do banco barra a segunda.
    if (erro?.code === 'P2002') throw conflito('Este conteúdo já foi recomendado a este paciente.');
    throw erro;
  }
}

export async function removerRecomendacao(profissional, pacienteId, recomendacaoId) {
  await exigirPacienteAcessivel(profissional, pacienteId);
  const recomendacao = await conteudoRepositorio.buscarRecomendacao({ id: recomendacaoId, pacienteId });
  if (!recomendacao) throw naoEncontrado('Recomendação não encontrada.');
  await conteudoRepositorio.excluirRecomendacao(recomendacaoId);
}

// ---------------------------------------------------------------------------------------------------------
// Conteúdos recomendados (paciente)
// ---------------------------------------------------------------------------------------------------------

export async function listarRecomendados(paciente, consulta) {
  const [itens, total] = await Promise.all([
    conteudoRepositorio.listarRecomendacoesDoPaciente({ pacienteId: paciente.id, ...calcularDeslocamento(consulta) }),
    conteudoRepositorio.contarRecomendacoesDoPaciente(paciente.id)
  ]);
  return respostaPaginada(itens.map(serializarRecomendacao), total, consulta);
}
