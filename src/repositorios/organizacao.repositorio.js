import { banco } from '../banco/cliente.js';

/** Acesso à tabela `organizacoes`. Nenhuma regra de negócio aqui. */

const contagens = { _count: { select: { administradores: true, profissionais: true, pacientes: true } } };

function filtro({ busca, tipo }) {
  return {
    ...(tipo ? { tipo } : {}),
    ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {})
  };
}

export const buscarPorId = (id) => banco.organizacao.findUnique({ where: { id } });

export const buscarPorIdComContagens = (id) => banco.organizacao.findUnique({ where: { id }, include: contagens });

/** Comparação sem diferenciar maiúsculas (o banco também garante via índice único em lower(nome)). */
export const buscarPorNome = (nome) =>
  banco.organizacao.findFirst({ where: { nome: { equals: nome, mode: 'insensitive' } }, select: { id: true } });

export const listar = ({ busca, tipo, pular, tomar }) =>
  banco.organizacao.findMany({
    where: filtro({ busca, tipo }),
    include: contagens,
    orderBy: [{ nome: 'asc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contar = (parametros) => banco.organizacao.count({ where: filtro(parametros) });

export const criar = (dados) => banco.organizacao.create({ data: dados });

export const atualizar = (id, dados) => banco.organizacao.update({ where: { id }, data: dados });

/** As chaves estrangeiras em cascata removem administradores, profissionais, pacientes e todo o histórico. */
export const excluir = (id) => banco.organizacao.delete({ where: { id } });

export async function contarTotais() {
  const [organizacoes, administradores, profissionais, pacientes] = await Promise.all([
    banco.organizacao.count(),
    banco.administrador.count(),
    banco.profissional.count(),
    banco.paciente.count()
  ]);
  return { organizacoes, administradores, profissionais, pacientes };
}
