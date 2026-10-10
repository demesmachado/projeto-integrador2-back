import { banco } from '../banco/cliente.js';

/** Acesso às tabelas `conteudos` e `recomendacoes`. Nenhuma regra de negócio aqui. */

/** Conteúdos que a organização enxerga: os globais do sistema (organizacao_id nulo) e os dela. */
const visiveisPara = (organizacaoId) => ({ OR: [{ organizacaoId: null }, { organizacaoId }] });

function filtro({ organizacaoId, tipo, busca }) {
  return {
    AND: [
      visiveisPara(organizacaoId),
      ...(tipo ? [{ tipo }] : []),
      ...(busca
        ? [{ OR: [{ titulo: { contains: busca, mode: 'insensitive' } }, { descricao: { contains: busca, mode: 'insensitive' } }] }]
        : [])
    ]
  };
}

export const buscarVisivel = (id, organizacaoId) =>
  banco.conteudo.findFirst({ where: { id, ...visiveisPara(organizacaoId) } });

export const buscarDoAutor = (id, criadoPorId) => banco.conteudo.findFirst({ where: { id, criadoPorId } });

export const listar = ({ organizacaoId, tipo, busca, pular, tomar }) =>
  banco.conteudo.findMany({
    where: filtro({ organizacaoId, tipo, busca }),
    orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contar = (parametros) => banco.conteudo.count({ where: filtro(parametros) });

export const criar = (dados) => banco.conteudo.create({ data: dados });

export const atualizar = (id, dados) => banco.conteudo.update({ where: { id }, data: dados });

/** As recomendações do conteúdo saem junto (cascata). */
export const excluir = (id) => banco.conteudo.delete({ where: { id } });

// ---- Recomendações (conteúdo ↔ paciente) ----

export const buscarRecomendacao = ({ id, pacienteId }) =>
  banco.recomendacao.findFirst({ where: { id, pacienteId } });

export const buscarRecomendacaoPorConteudo = ({ conteudoId, pacienteId }) =>
  banco.recomendacao.findUnique({ where: { conteudoId_pacienteId: { conteudoId, pacienteId } } });

export const criarRecomendacao = (dados) =>
  banco.recomendacao.create({
    data: dados,
    include: { conteudo: true, profissional: { select: { id: true, nome: true } } }
  });

export const excluirRecomendacao = (id) => banco.recomendacao.delete({ where: { id } });

export const listarRecomendacoesDoPaciente = ({ pacienteId, pular, tomar }) =>
  banco.recomendacao.findMany({
    where: { pacienteId },
    include: { conteudo: true, profissional: { select: { id: true, nome: true } } },
    orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
    skip: pular,
    take: tomar
  });

export const contarRecomendacoesDoPaciente = (pacienteId) => banco.recomendacao.count({ where: { pacienteId } });
