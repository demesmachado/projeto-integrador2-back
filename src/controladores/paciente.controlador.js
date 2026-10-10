import * as evolucaoServico from '../servicos/evolucao.servico.js';
import * as pacienteServico from '../servicos/paciente.servico.js';

export async function listar(req, res) {
  res.json(await pacienteServico.listar(req.usuario, req.validado.consulta));
}

export async function obter(req, res) {
  res.json(await pacienteServico.obter(req.usuario, req.validado.parametros.id));
}

/** Devolve a senha gerada UMA vez: ela não fica guardada em texto no servidor. */
export async function criar(req, res) {
  res.status(201).json(await pacienteServico.criar(req.usuario, req.validado.corpo));
}

export async function atualizar(req, res) {
  res.json(await pacienteServico.atualizar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await pacienteServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}

export async function redefinirSenha(req, res) {
  res.json(await pacienteServico.redefinirSenha(req.usuario, req.validado.parametros.id));
}

// ---- Parte clínica da ficha (somente o profissional responsável) ----

export async function listarHistorico(req, res) {
  res.json(
    await evolucaoServico.listarHistoricoDeConsultas(req.usuario, req.validado.parametros.id, req.validado.consulta)
  );
}

export async function listarEvolucoes(req, res) {
  res.json(await evolucaoServico.listar(req.usuario, req.validado.parametros.id, req.validado.consulta));
}

export async function criarEvolucao(req, res) {
  res.status(201).json(await evolucaoServico.criar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}
