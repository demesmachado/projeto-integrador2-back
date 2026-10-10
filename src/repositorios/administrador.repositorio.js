import { banco } from '../banco/cliente.js';

/** Acesso à tabela `administradores`. Nenhuma regra de negócio aqui. */

export const buscarPorId = (id) => banco.administrador.findUnique({ where: { id } });

export const buscarPorEmail = (email) => banco.administrador.findUnique({ where: { email } });

/** Único lugar (além de trocar senha) em que o hash é lido do banco. */
export const buscarPorEmailComSenha = (email) =>
  banco.administrador.findUnique({ where: { email }, omit: { senhaHash: false } });

export const buscarPorIdComSenha = (id) =>
  banco.administrador.findUnique({ where: { id }, omit: { senhaHash: false } });

/** Mínimo necessário para validar um JWT a cada requisição (consulta por chave primária). */
export const buscarCredencialPorId = (id) =>
  banco.administrador.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, organizacaoId: true, versaoToken: true }
  });

export const listarPorOrganizacao = (organizacaoId) =>
  banco.administrador.findMany({ where: { organizacaoId }, orderBy: [{ nome: 'asc' }, { id: 'asc' }] });

export const criar = (dados) => banco.administrador.create({ data: dados });

export const atualizar = (id, dados) => banco.administrador.update({ where: { id }, data: dados });

export const excluir = (id) => banco.administrador.delete({ where: { id } });

export const incrementarVersaoToken = (id) =>
  banco.administrador.update({ where: { id }, data: { versaoToken: { increment: 1 } }, select: { versaoToken: true } });
