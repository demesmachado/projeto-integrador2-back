import * as conteudoServico from '../servicos/conteudo.servico.js';

// ---- Biblioteca (profissional) ----

export async function listar(req, res) {
  res.json(await conteudoServico.listar(req.usuario, req.validado.consulta));
}

export async function criar(req, res) {
  res.status(201).json(await conteudoServico.criar(req.usuario, req.validado.corpo));
}

export async function atualizar(req, res) {
  res.json(await conteudoServico.atualizar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await conteudoServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}

// ---- Recomendações na ficha do paciente (profissional) ----

export async function listarRecomendacoes(req, res) {
  res.json(await conteudoServico.listarRecomendacoes(req.usuario, req.validado.parametros.id, req.validado.consulta));
}

export async function recomendar(req, res) {
  res.status(201).json(await conteudoServico.recomendar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function removerRecomendacao(req, res) {
  const { id, recomendacaoId } = req.validado.parametros;
  await conteudoServico.removerRecomendacao(req.usuario, id, recomendacaoId);
  res.status(204).end();
}

// ---- Paciente ----

export async function listarRecomendados(req, res) {
  res.json(await conteudoServico.listarRecomendados(req.usuario, req.validado.consulta));
}
