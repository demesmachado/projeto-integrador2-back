/** `organizacao` pode vir com `_count` (listagens/detalhe do Super Admin). */
export function serializarOrganizacao(organizacao) {
  return {
    id: organizacao.id,
    nome: organizacao.nome,
    tipo: organizacao.tipo,
    criadoEm: organizacao.criadoEm.toISOString(),
    ...(organizacao._count
      ? {
          totais: {
            administradores: organizacao._count.administradores,
            profissionais: organizacao._count.profissionais,
            pacientes: organizacao._count.pacientes
          }
        }
      : {})
  };
}

export function serializarAdministrador(administrador) {
  return {
    id: administrador.id,
    nome: administrador.nome,
    email: administrador.email,
    organizacaoId: administrador.organizacaoId,
    criadoEm: administrador.criadoEm.toISOString()
  };
}
