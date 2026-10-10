import * as administradorRepositorio from '../repositorios/administrador.repositorio.js';
import * as organizacaoRepositorio from '../repositorios/organizacao.repositorio.js';
import { serializarAdministrador, serializarOrganizacao } from '../serializadores/organizacao.serializador.js';
import { conflito, naoEncontrado } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { gerarHashSenha } from '../utilitarios/senha.js';

/** Regras do Super Administrador: organizações e seus administradores. */

async function exigirOrganizacao(id) {
  const organizacao = await organizacaoRepositorio.buscarPorId(id);
  if (!organizacao) throw naoEncontrado('Organização não encontrada.');
  return organizacao;
}

async function garantirNomeLivre(nome, ignorarId) {
  const existente = await organizacaoRepositorio.buscarPorNome(nome);
  if (existente && existente.id !== ignorarId) {
    throw conflito('Já existe uma organização com este nome.', [
      { campo: 'corpo.nome', mensagem: 'Já existe uma organização com este nome.' }
    ]);
  }
}

export async function listar(consulta) {
  const [itens, total] = await Promise.all([
    organizacaoRepositorio.listar({ ...consulta, ...calcularDeslocamento(consulta) }),
    organizacaoRepositorio.contar(consulta)
  ]);
  return respostaPaginada(itens.map(serializarOrganizacao), total, consulta);
}

export async function obter(id) {
  const organizacao = await organizacaoRepositorio.buscarPorIdComContagens(id);
  if (!organizacao) throw naoEncontrado('Organização não encontrada.');
  return serializarOrganizacao(organizacao);
}

export async function criar({ nome, tipo }) {
  await garantirNomeLivre(nome);
  const organizacao = await organizacaoRepositorio.criar({ nome, tipo });
  return serializarOrganizacao(organizacao);
}

export async function atualizar(id, { nome, tipo }) {
  await exigirOrganizacao(id);
  await garantirNomeLivre(nome, id);
  await organizacaoRepositorio.atualizar(id, { nome, tipo });
  return obter(id);
}

/** Exclui a organização e, em cascata, administradores, profissionais, pacientes e todo o histórico. */
export async function excluir(id) {
  await exigirOrganizacao(id);
  await organizacaoRepositorio.excluir(id);
}

// ---------------------------------------------------------------------------------------------------------
// Administradores (o Super Admin define o e-mail e a senha)
// ---------------------------------------------------------------------------------------------------------

const MENSAGEM_EMAIL_EM_USO = 'Já existe um administrador com este e-mail.';

async function garantirEmailLivre(email, ignorarId) {
  const existente = await administradorRepositorio.buscarPorEmail(email);
  if (existente && existente.id !== ignorarId) {
    throw conflito(MENSAGEM_EMAIL_EM_USO, [{ campo: 'corpo.email', mensagem: MENSAGEM_EMAIL_EM_USO }]);
  }
}

export async function listarAdministradores(organizacaoId) {
  await exigirOrganizacao(organizacaoId);
  const administradores = await administradorRepositorio.listarPorOrganizacao(organizacaoId);
  return administradores.map(serializarAdministrador);
}

export async function criarAdministrador(organizacaoId, { nome, email, senha }) {
  await exigirOrganizacao(organizacaoId);
  await garantirEmailLivre(email);
  const administrador = await administradorRepositorio.criar({
    organizacaoId,
    nome,
    email,
    senhaHash: await gerarHashSenha(senha)
  });
  return serializarAdministrador(administrador);
}

export async function atualizarAdministrador(id, { nome, email, novaSenha }) {
  const atual = await administradorRepositorio.buscarPorId(id);
  if (!atual) throw naoEncontrado('Administrador não encontrado.');
  await garantirEmailLivre(email, id);

  const alteracoes = { nome, email };
  if (novaSenha) {
    alteracoes.senhaHash = await gerarHashSenha(novaSenha);
    alteracoes.versaoToken = { increment: 1 }; // derruba as sessões abertas com a senha antiga
  }
  const administrador = await administradorRepositorio.atualizar(id, alteracoes);
  return serializarAdministrador(administrador);
}

export async function excluirAdministrador(id) {
  const atual = await administradorRepositorio.buscarPorId(id);
  if (!atual) throw naoEncontrado('Administrador não encontrado.');
  await administradorRepositorio.excluir(id);
}
