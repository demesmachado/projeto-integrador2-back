/** `usuario` (opcional) permite informar se o conteúdo é editável por quem pediu. */
export function serializarConteudo(conteudo, usuario) {
  return {
    id: conteudo.id,
    titulo: conteudo.titulo,
    tipo: conteudo.tipo,
    descricao: conteudo.descricao,
    url: conteudo.url ?? null,
    global: conteudo.organizacaoId === null,
    ...(usuario ? { editavel: conteudo.criadoPorId === usuario.id } : {}),
    criadoEm: conteudo.criadoEm.toISOString()
  };
}

export function serializarRecomendacao(recomendacao) {
  return {
    id: recomendacao.id,
    pacienteId: recomendacao.pacienteId,
    conteudo: serializarConteudo(recomendacao.conteudo),
    recomendadoPor: recomendacao.profissional
      ? { id: recomendacao.profissional.id, nome: recomendacao.profissional.nome }
      : null,
    criadoEm: recomendacao.criadoEm.toISOString()
  };
}
