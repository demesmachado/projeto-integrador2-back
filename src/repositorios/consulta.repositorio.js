import { banco } from '../banco/cliente.js';
import { STATUS_CONSULTA } from '../config/constantes.js';

/**
 * Acesso à tabela `consultas` (horários da agenda). Nenhuma regra de negócio aqui.
 *
 * As mudanças de status usam `updateMany` com o status esperado na cláusula `where`: a checagem e a troca
 * acontecem num único comando, então duas requisições simultâneas (dois pacientes pedindo o mesmo horário,
 * por exemplo) nunca passam as duas — só uma altera linhas, a outra recebe `count = 0`.
 */

const incluirPaciente = { paciente: { select: { id: true, nome: true } } };
const incluirProfissional = { profissional: { select: { id: true, nome: true, especialidade: true } } };
const incluirAmbos = { ...incluirPaciente, ...incluirProfissional };

const ordenacao = [{ data: 'asc' }, { hora: 'asc' }];

export const buscarPorId = (id) => banco.consulta.findUnique({ where: { id }, include: incluirAmbos });

export const buscarDoProfissional = (id, profissionalId) =>
  banco.consulta.findFirst({ where: { id, profissionalId }, include: incluirAmbos });

export const buscarDoPaciente = (id, pacienteId) =>
  banco.consulta.findFirst({ where: { id, pacienteId }, include: incluirAmbos });

export const criarHorario = ({ profissionalId, data, hora }) =>
  banco.consulta.create({ data: { profissionalId, data, hora }, include: incluirAmbos });

function filtroDoProfissional({ profissionalId, status, busca, de, ate }) {
  return {
    profissionalId,
    ...(status ? { status } : {}),
    ...(de || ate ? { data: { ...(de ? { gte: de } : {}), ...(ate ? { lte: ate } : {}) } } : {}),
    ...(busca ? { paciente: { nome: { contains: busca, mode: 'insensitive' } } } : {})
  };
}

export const listarDoProfissional = ({ pular, tomar, ...filtros }) =>
  banco.consulta.findMany({
    where: filtroDoProfissional(filtros),
    include: incluirPaciente,
    orderBy: ordenacao,
    skip: pular,
    take: tomar
  });

export const contarDoProfissional = (filtros) => banco.consulta.count({ where: filtroDoProfissional(filtros) });

/** Horários livres de um profissional a partir de `hoje`. */
export const listarDisponiveis = ({ profissionalId, hoje, pular, tomar }) =>
  banco.consulta.findMany({
    where: { profissionalId, status: STATUS_CONSULTA.DISPONIVEL, data: { gte: hoje } },
    orderBy: ordenacao,
    skip: pular,
    take: tomar
  });

export const contarDisponiveis = ({ profissionalId, hoje }) =>
  banco.consulta.count({ where: { profissionalId, status: STATUS_CONSULTA.DISPONIVEL, data: { gte: hoje } } });

export const listarDoPaciente = ({ pacienteId, status, pular, tomar }) =>
  banco.consulta.findMany({
    where: { pacienteId, ...(status ? { status } : {}) },
    include: incluirProfissional,
    orderBy: ordenacao,
    skip: pular,
    take: tomar
  });

export const contarDoPaciente = ({ pacienteId, status }) =>
  banco.consulta.count({ where: { pacienteId, ...(status ? { status } : {}) } });

/** Consultas realizadas (com dado clínico cifrado), da mais recente para a mais antiga. */
export const listarRealizadasDoPaciente = ({ pacienteId, pular = 0, tomar }) =>
  banco.consulta.findMany({
    where: { pacienteId, status: STATUS_CONSULTA.REALIZADA },
    include: incluirProfissional,
    orderBy: [{ data: 'desc' }, { hora: 'desc' }],
    skip: pular,
    take: tomar
  });

export const contarRealizadasDoPaciente = (pacienteId) =>
  banco.consulta.count({ where: { pacienteId, status: STATUS_CONSULTA.REALIZADA } });

/** Quantas solicitações/confirmações futuras o paciente tem em aberto. */
export const contarEmAbertoDoPaciente = ({ pacienteId, hoje }) =>
  banco.consulta.count({
    where: {
      pacienteId,
      status: { in: [STATUS_CONSULTA.SOLICITADA, STATUS_CONSULTA.CONFIRMADA] },
      data: { gte: hoje }
    }
  });

export const listarProximasDoPaciente = ({ pacienteId, hoje, tomar }) =>
  banco.consulta.findMany({
    where: {
      pacienteId,
      status: { in: [STATUS_CONSULTA.SOLICITADA, STATUS_CONSULTA.CONFIRMADA] },
      data: { gte: hoje }
    },
    include: incluirProfissional,
    orderBy: ordenacao,
    take: tomar
  });

export const listarProximasDoProfissional = ({ profissionalId, hoje, tomar }) =>
  banco.consulta.findMany({
    where: {
      profissionalId,
      status: { in: [STATUS_CONSULTA.SOLICITADA, STATUS_CONSULTA.CONFIRMADA] },
      data: { gte: hoje }
    },
    include: incluirPaciente,
    orderBy: ordenacao,
    take: tomar
  });

export const contarConfirmadasNoDia = ({ profissionalId, dia }) =>
  banco.consulta.count({ where: { profissionalId, status: STATUS_CONSULTA.CONFIRMADA, data: dia } });

export const contarPendentes = (profissionalId) =>
  banco.consulta.count({ where: { profissionalId, status: STATUS_CONSULTA.SOLICITADA } });

export const contarRealizadasDaOrganizacao = (organizacaoId) =>
  banco.consulta.count({ where: { status: STATUS_CONSULTA.REALIZADA, profissional: { organizacaoId } } });

/** Troca atômica de status. Devolve quantas linhas foram alteradas (0 ou 1). */
export async function transicionar({ where, dados }) {
  const { count } = await banco.consulta.updateMany({ where, data: dados });
  return count;
}

export async function excluirSe({ id, profissionalId, statusPermitidos }) {
  const { count } = await banco.consulta.deleteMany({ where: { id, profissionalId, status: { in: statusPermitidos } } });
  return count;
}
