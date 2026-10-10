import { banco } from '../banco/cliente.js';

/** Acesso à tabela `evolucoes`. Registros imutáveis: só há criação e leitura. */

const incluirProfissional = { profissional: { select: { id: true, nome: true, especialidade: true } } };

export const criar = (dados) => banco.evolucao.create({ data: dados, include: incluirProfissional });

export const listarDoPaciente = ({ pacienteId, pular, tomar }) =>
  banco.evolucao.findMany({
    where: { pacienteId },
    include: incluirProfissional,
    orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contarDoPaciente = (pacienteId) => banco.evolucao.count({ where: { pacienteId } });
