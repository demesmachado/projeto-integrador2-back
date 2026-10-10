import { formatarTelefone } from '../utilitarios/telefone.js';

/** `profissional` pode vir com `_count.pacientes` (listagem do administrador). */
export function serializarProfissional(profissional) {
  return {
    id: profissional.id,
    nome: profissional.nome,
    especialidade: profissional.especialidade,
    crm: profissional.crm ?? null,
    telefone: profissional.telefone ? formatarTelefone(profissional.telefone) : null,
    email: profissional.email,
    organizacaoId: profissional.organizacaoId,
    ativo: profissional.ativo,
    senhaTemporaria: profissional.senhaTemporaria,
    ...(profissional._count ? { totalPacientes: profissional._count.pacientes } : {}),
    criadoEm: profissional.criadoEm.toISOString()
  };
}

/** Dados mínimos do profissional exibidos a pacientes (nunca e-mail, telefone ou registro). */
export function serializarProfissionalResumo(profissional) {
  if (!profissional) return null;
  return { id: profissional.id, nome: profissional.nome, especialidade: profissional.especialidade };
}
