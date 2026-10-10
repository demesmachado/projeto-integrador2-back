import * as profissionalRepositorio from '../repositorios/profissional.repositorio.js';
import { serializarProfissional } from '../serializadores/profissional.serializador.js';
import { conflito } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { gerarHashSenha, gerarSenhaTemporaria } from '../utilitarios/senha.js';
import { exigirProfissionalDaOrganizacao } from './acesso.servico.js';

/**
 * Regras do administrador sobre os profissionais da PRÓPRIA organização.
 * A senha de acesso é gerada pelo sistema (6 dígitos) e devolvida uma única vez: não fica guardada em texto.
 */

const MENSAGEM_EMAIL_EM_USO = 'Já existe um profissional com este e-mail.';

async function garantirEmailLivre(email, ignorarId) {
  const existente = await profissionalRepositorio.buscarPorEmail(email);
  if (existente && existente.id !== ignorarId) {
    throw conflito(MENSAGEM_EMAIL_EM_USO, [{ campo: 'corpo.email', mensagem: MENSAGEM_EMAIL_EM_USO }]);
  }
}

export async function listar(administrador, consulta) {
  const filtros = { organizacaoId: administrador.organizacaoId, busca: consulta.busca };
  const [itens, total] = await Promise.all([
    profissionalRepositorio.listar({ ...filtros, ...calcularDeslocamento(consulta) }),
    profissionalRepositorio.contar(filtros)
  ]);
  return respostaPaginada(itens.map(serializarProfissional), total, consulta);
}

export async function obter(administrador, id) {
  const profissional = await exigirProfissionalDaOrganizacao(administrador, id);
  return serializarProfissional(profissional);
}

export async function criar(administrador, dados) {
  await garantirEmailLivre(dados.email);

  const senhaGerada = gerarSenhaTemporaria();
  const profissional = await profissionalRepositorio.criar({
    organizacaoId: administrador.organizacaoId,
    nome: dados.nome,
    especialidade: dados.especialidade,
    crm: dados.crm ?? null,
    telefone: dados.telefone ?? null,
    email: dados.email,
    senhaHash: await gerarHashSenha(senhaGerada),
    senhaTemporaria: true
  });

  return { profissional: serializarProfissional(profissional), senhaGerada };
}

export async function atualizar(administrador, id, dados) {
  await exigirProfissionalDaOrganizacao(administrador, id);
  await garantirEmailLivre(dados.email, id);

  const profissional = await profissionalRepositorio.atualizar(id, {
    nome: dados.nome,
    especialidade: dados.especialidade,
    crm: dados.crm,
    telefone: dados.telefone,
    email: dados.email,
    ativo: dados.ativo
  });
  return serializarProfissional(profissional);
}

/**
 * Só exclui quem não tem histórico clínico. Os horários livres/recusados/cancelados saem junto e os
 * pacientes ficam sem profissional responsável. Para encerrar o acesso de quem tem histórico, use `ativo: false`.
 */
export async function excluir(administrador, id) {
  await exigirProfissionalDaOrganizacao(administrador, id);

  if (await profissionalRepositorio.possuiHistoricoClinico(id)) {
    throw conflito(
      'Este profissional possui atendimentos ou evoluções registrados e não pode ser excluído. Desative a conta (ativo: false) para encerrar o acesso preservando o histórico.'
    );
  }
  await profissionalRepositorio.excluir(id);
}

/** Gera nova senha temporária (para quem esqueceu a senha) e encerra as sessões abertas. */
export async function redefinirSenha(administrador, id) {
  await exigirProfissionalDaOrganizacao(administrador, id);

  const senhaGerada = gerarSenhaTemporaria();
  await profissionalRepositorio.atualizar(id, {
    senhaHash: await gerarHashSenha(senhaGerada),
    senhaTemporaria: true,
    versaoToken: { increment: 1 }
  });
  return { senhaGerada };
}
