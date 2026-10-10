import { banco } from '../banco/cliente.js';

/**
 * Acesso à tabela `pacientes`. Nenhuma regra de negócio aqui.
 * Atenção: as colunas `dados_cifrados` continuam cifradas; quem decifra é a camada de serviço.
 */

function filtro({ organizacaoId, profissionalId, busca }) {
  return {
    organizacaoId,
    ...(profissionalId ? { profissionalId } : {}),
    ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {})
  };
}

const comProfissional = { profissional: { select: { id: true, nome: true, especialidade: true } } };

export const buscarPorId = (id) => banco.paciente.findUnique({ where: { id }, include: comProfissional });

/** Já restrito à organização (e, opcionalmente, ao profissional responsável). */
export const buscarAcessivel = ({ id, organizacaoId, profissionalId }) =>
  banco.paciente.findFirst({
    where: { id, organizacaoId, ...(profissionalId ? { profissionalId } : {}) },
    include: comProfissional
  });

export const buscarPorIndiceEmail = (emailIndice) => banco.paciente.findUnique({ where: { emailIndice } });

export const buscarPorIndiceEmailComSenha = (emailIndice) =>
  banco.paciente.findUnique({ where: { emailIndice }, omit: { senhaHash: false } });

export const buscarPorIdComSenha = (id) =>
  banco.paciente.findUnique({ where: { id }, omit: { senhaHash: false } });

export const buscarCredencialPorId = (id) =>
  banco.paciente.findUnique({
    where: { id },
    select: { id: true, nome: true, organizacaoId: true, profissionalId: true, dadosCifrados: true, versaoToken: true }
  });

export const listar = ({ organizacaoId, profissionalId, busca, pular, tomar }) =>
  banco.paciente.findMany({
    where: filtro({ organizacaoId, profissionalId, busca }),
    include: comProfissional,
    orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contar = (parametros) => banco.paciente.count({ where: filtro(parametros) });

export const contarPorProfissional = (profissionalId) => banco.paciente.count({ where: { profissionalId } });

export const criar = (dados) => banco.paciente.create({ data: dados, include: comProfissional });

export const atualizar = (id, dados) => banco.paciente.update({ where: { id }, data: dados, include: comProfissional });

/** Cascata: consultas, evoluções, notificações e recomendações do paciente saem junto (direito de exclusão). */
export const excluir = (id) => banco.paciente.delete({ where: { id } });

export const incrementarVersaoToken = (id) =>
  banco.paciente.update({ where: { id }, data: { versaoToken: { increment: 1 } }, select: { versaoToken: true } });
