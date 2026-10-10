import * as consultaServico from '../servicos/consulta.servico.js';

export async function listarDisponiveis(req, res) {
  res.json(await consultaServico.listarDisponiveis(req.usuario, req.validado.consulta));
}

export async function listarMinhas(req, res) {
  res.json(await consultaServico.listarMinhas(req.usuario, req.validado.consulta));
}

export async function listarHistorico(req, res) {
  res.json(await consultaServico.listarHistorico(req.usuario, req.validado.consulta));
}

export async function solicitar(req, res) {
  res.json(await consultaServico.solicitar(req.usuario, req.validado.parametros.id));
}

export async function cancelarSolicitacao(req, res) {
  await consultaServico.cancelarSolicitacao(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}
