import * as notificacaoServico from '../servicos/notificacao.servico.js';

// ---- Profissional ----

export async function listarEnviadas(req, res) {
  res.json(await notificacaoServico.listarEnviadas(req.usuario, req.validado.consulta));
}

export async function enviar(req, res) {
  res.status(201).json(await notificacaoServico.enviar(req.usuario, req.validado.corpo));
}

export async function corrigir(req, res) {
  res.json(await notificacaoServico.corrigir(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await notificacaoServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}

// ---- Paciente ----

export async function listarMinhas(req, res) {
  res.json(await notificacaoServico.listarMinhas(req.usuario, req.validado.consulta));
}

export async function contarNaoLidas(req, res) {
  res.json(await notificacaoServico.contarNaoLidas(req.usuario));
}

export async function marcarComoLida(req, res) {
  await notificacaoServico.marcarComoLida(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}

export async function marcarTodasComoLidas(req, res) {
  res.json(await notificacaoServico.marcarTodasComoLidas(req.usuario));
}
