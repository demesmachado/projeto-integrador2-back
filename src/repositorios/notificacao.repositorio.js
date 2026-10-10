import { banco } from '../banco/cliente.js';

/** Acesso à tabela `notificacoes`. O conteúdo (título e mensagem) continua cifrado aqui. */

const incluirPaciente = { paciente: { select: { id: true, nome: true } } };

export const buscarDoProfissional = (id, profissionalId) =>
  banco.notificacao.findFirst({ where: { id, profissionalId }, include: incluirPaciente });

export const buscarDoPaciente = (id, pacienteId) => banco.notificacao.findFirst({ where: { id, pacienteId } });

export const criar = (dados) => banco.notificacao.create({ data: dados, include: incluirPaciente });

export const atualizar = (id, dados) => banco.notificacao.update({ where: { id }, data: dados, include: incluirPaciente });

export const excluir = (id) => banco.notificacao.delete({ where: { id } });

export const listarDoProfissional = ({ profissionalId, pacienteId, tipo, pular, tomar }) =>
  banco.notificacao.findMany({
    where: { profissionalId, ...(pacienteId ? { pacienteId } : {}), ...(tipo ? { tipo } : {}) },
    include: incluirPaciente,
    orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contarDoProfissional = ({ profissionalId, pacienteId, tipo }) =>
  banco.notificacao.count({
    where: { profissionalId, ...(pacienteId ? { pacienteId } : {}), ...(tipo ? { tipo } : {}) }
  });

export const listarDoPaciente = ({ pacienteId, apenasNaoLidas, pular, tomar }) =>
  banco.notificacao.findMany({
    where: { pacienteId, ...(apenasNaoLidas ? { lida: false } : {}) },
    orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contarDoPaciente = ({ pacienteId, apenasNaoLidas }) =>
  banco.notificacao.count({ where: { pacienteId, ...(apenasNaoLidas ? { lida: false } : {}) } });

export const marcarComoLida = async (id, pacienteId) => {
  const { count } = await banco.notificacao.updateMany({ where: { id, pacienteId, lida: false }, data: { lida: true } });
  return count;
};

export const marcarTodasComoLidas = async (pacienteId) => {
  const { count } = await banco.notificacao.updateMany({ where: { pacienteId, lida: false }, data: { lida: true } });
  return count;
};
