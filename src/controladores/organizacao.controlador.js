import * as organizacaoServico from '../servicos/organizacao.servico.js';

export async function listar(req, res) {
  res.json(await organizacaoServico.listar(req.validado.consulta));
}

export async function obter(req, res) {
  res.json(await organizacaoServico.obter(req.validado.parametros.id));
}

export async function criar(req, res) {
  res.status(201).json(await organizacaoServico.criar(req.validado.corpo));
}

export async function atualizar(req, res) {
  res.json(await organizacaoServico.atualizar(req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await organizacaoServico.excluir(req.validado.parametros.id);
  res.status(204).end();
}

// ---- Administradores ----

export async function listarAdministradores(req, res) {
  res.json({ itens: await organizacaoServico.listarAdministradores(req.validado.parametros.id) });
}

export async function criarAdministrador(req, res) {
  res.status(201).json(await organizacaoServico.criarAdministrador(req.validado.parametros.id, req.validado.corpo));
}

export async function atualizarAdministrador(req, res) {
  res.json(await organizacaoServico.atualizarAdministrador(req.validado.parametros.id, req.validado.corpo));
}

export async function excluirAdministrador(req, res) {
  await organizacaoServico.excluirAdministrador(req.validado.parametros.id);
  res.status(204).end();
}
