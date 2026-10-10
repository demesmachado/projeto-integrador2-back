import * as autenticacaoServico from '../servicos/autenticacao.servico.js';

export async function entrar(req, res) {
  res.json(await autenticacaoServico.entrar(req.validado.corpo));
}

export async function sair(req, res) {
  await autenticacaoServico.sair(req.usuario);
  res.status(204).end();
}

export async function obterPerfil(req, res) {
  res.json({ usuario: await autenticacaoServico.obterPerfil(req.usuario) });
}

export async function alterarSenha(req, res) {
  res.json(await autenticacaoServico.alterarSenha(req.usuario, req.validado.corpo));
}
