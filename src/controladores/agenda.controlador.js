import * as agendaServico from '../servicos/agenda.servico.js';

export async function listar(req, res) {
  res.json(await agendaServico.listar(req.usuario, req.validado.consulta));
}

export async function obter(req, res) {
  res.json(await agendaServico.obter(req.usuario, req.validado.parametros.id));
}

export async function criarHorario(req, res) {
  res.status(201).json(await agendaServico.criarHorario(req.usuario, req.validado.corpo));
}

export async function confirmar(req, res) {
  res.json(await agendaServico.confirmar(req.usuario, req.validado.parametros.id));
}

export async function recusar(req, res) {
  res.json(await agendaServico.recusar(req.usuario, req.validado.parametros.id));
}

export async function cancelar(req, res) {
  res.json(await agendaServico.cancelar(req.usuario, req.validado.parametros.id));
}

export async function registrar(req, res) {
  res.json(await agendaServico.registrar(req.usuario, req.validado.parametros.id, req.validado.corpo));
}

export async function excluir(req, res) {
  await agendaServico.excluir(req.usuario, req.validado.parametros.id);
  res.status(204).end();
}
