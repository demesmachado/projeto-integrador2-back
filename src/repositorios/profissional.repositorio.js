import { banco } from '../banco/cliente.js';
import { STATUS_EXCLUIVEIS } from '../config/constantes.js';

/** Acesso à tabela `profissionais`. Nenhuma regra de negócio aqui. */

function filtro({ organizacaoId, busca }) {
  return {
    organizacaoId,
    ...(busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { especialidade: { contains: busca, mode: 'insensitive' } }
          ]
        }
      : {})
  };
}

export const buscarPorId = (id) => banco.profissional.findUnique({ where: { id } });

/** Busca já restrita à organização: o recurso de outra organização "não existe" para quem pergunta. */
export const buscarDaOrganizacao = (id, organizacaoId) =>
  banco.profissional.findFirst({ where: { id, organizacaoId } });

export const buscarPorEmail = (email) => banco.profissional.findUnique({ where: { email } });

export const buscarPorEmailComSenha = (email) =>
  banco.profissional.findUnique({ where: { email }, omit: { senhaHash: false } });

export const buscarPorIdComSenha = (id) =>
  banco.profissional.findUnique({ where: { id }, omit: { senhaHash: false } });

export const buscarCredencialPorId = (id) =>
  banco.profissional.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, organizacaoId: true, ativo: true, versaoToken: true }
  });

export const listar = ({ organizacaoId, busca, pular, tomar }) =>
  banco.profissional.findMany({
    where: filtro({ organizacaoId, busca }),
    include: { _count: { select: { pacientes: true } } },
    orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contar = (parametros) => banco.profissional.count({ where: filtro(parametros) });

export const listarRecentes = (organizacaoId, quantidade) =>
  banco.profissional.findMany({
    where: { organizacaoId },
    include: { _count: { select: { pacientes: true } } },
    orderBy: { criadoEm: 'desc' },
    take: quantidade
  });

export const criar = (dados) => banco.profissional.create({ data: dados });

export const atualizar = (id, dados) => banco.profissional.update({ where: { id }, data: dados });

export const excluir = (id) => banco.profissional.delete({ where: { id } });

export const incrementarVersaoToken = (id) =>
  banco.profissional.update({ where: { id }, data: { versaoToken: { increment: 1 } }, select: { versaoToken: true } });

/**
 * Histórico que impede a exclusão: consultas em andamento/realizadas (os horários livres, recusados e
 * cancelados podem ser apagados junto) e qualquer evolução registrada.
 */
export async function possuiHistoricoClinico(id) {
  const [consultas, evolucoes] = await Promise.all([
    banco.consulta.count({ where: { profissionalId: id, status: { notIn: STATUS_EXCLUIVEIS } } }),
    banco.evolucao.count({ where: { profissionalId: id } })
  ]);
  return consultas > 0 || evolucoes > 0;
}
