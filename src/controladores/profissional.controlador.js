import * as profissionalServico from '../servicos/profissional.servico.js';

export async function listar(req, res) {
  res.json(await profissionalServico.listar(req.usuario, req.validado.consulta));
}

export async function obter(req, res) {
  res.json(await profissionalServico.obter(req.usuario, req.validado.parametros.id));
}

/** Devolve a senha gerada UMA vez: ela não fica guardada em texto no servidor. */
export async function criar(req, res) {
  res.status(201).json(await profissionalServico.criar(req.usuario, req.validado.corpo));
}

export async function atualizar(req, res) {
  res.json(await profissionalServico.atualizar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await profissionalServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}

export async function redefinirSenha(req, res) {
  res.json(await profissionalServico.redefinirSenha(req.usuario, req.validado.parametros.id));
}
