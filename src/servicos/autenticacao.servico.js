import { ambiente } from '../config/ambiente.js';
import { PAPEIS } from '../config/constantes.js';
import * as administradorRepositorio from '../repositorios/administrador.repositorio.js';
import * as organizacaoRepositorio from '../repositorios/organizacao.repositorio.js';
import * as pacienteRepositorio from '../repositorios/paciente.repositorio.js';
import * as profissionalRepositorio from '../repositorios/profissional.repositorio.js';
import { serializarPaciente } from '../serializadores/paciente.serializador.js';
import { serializarProfissional } from '../serializadores/profissional.serializador.js';
import { decifrarDadosPaciente, indiceEmailPaciente } from '../utilitarios/dadosPaciente.js';
import { credenciaisInvalidas, ErroApp, proibido } from '../utilitarios/erros.js';
import {
  conferirSenha,
  conferirSenhaContraHashFalso,
  gerarHashSenha,
  igualdadeSegura,
  obterHashSuperAdmin
} from '../utilitarios/senha.js';
import { gerarToken } from '../utilitarios/token.js';

const NOME_DO_SUPERADMIN = 'Super Administrador';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------------------------------------
// Descrição pública do usuário logado (resposta do login e de GET /autenticacao/eu)
// ---------------------------------------------------------------------------------------------------------

async function resumirOrganizacao(organizacaoId) {
  const organizacao = await organizacaoRepositorio.buscarPorId(organizacaoId);
  return organizacao ? { id: organizacao.id, nome: organizacao.nome, tipo: organizacao.tipo } : null;
}

/** `conta` é a linha do banco (sem hash). Devolve só o que o próprio usuário pode ver. */
async function descreverUsuario(papel, conta) {
  switch (papel) {
    case PAPEIS.SUPERADMIN:
      return { id: null, papel, nome: NOME_DO_SUPERADMIN, email: ambiente.superAdmin.email };

    case PAPEIS.ADMIN:
      return {
        id: conta.id,
        papel,
        nome: conta.nome,
        email: conta.email,
        organizacao: await resumirOrganizacao(conta.organizacaoId)
      };

    case PAPEIS.PROFISSIONAL: {
      const { organizacaoId, ...dados } = serializarProfissional(conta);
      return { ...dados, papel, organizacao: await resumirOrganizacao(organizacaoId) };
    }

    case PAPEIS.PACIENTE: {
      const completo = conta.profissional === undefined ? await pacienteRepositorio.buscarPorId(conta.id) : conta;
      const { organizacaoId, ...dados } = serializarPaciente(completo, decifrarDadosPaciente(completo));
      return { ...dados, papel, organizacao: await resumirOrganizacao(organizacaoId) };
    }

    default:
      throw new ErroApp(500, 'ERRO_INTERNO', 'Erro interno do servidor.');
  }
}

/** Resposta padrão de sessão: token Bearer + dados do usuário. */
async function emitirSessao(papel, conta) {
  const expiracao = papel === PAPEIS.SUPERADMIN ? ambiente.expiracaoJwtSuperAdmin : ambiente.expiracaoJwt;
  const { token, expiraEm } = gerarToken(
    { sub: papel === PAPEIS.SUPERADMIN ? PAPEIS.SUPERADMIN : conta.id, papel, versao: conta?.versaoToken ?? 0 },
    expiracao
  );
  return { token, tipo: 'Bearer', expiraEm, usuario: await descreverUsuario(papel, conta) };
}

// ---------------------------------------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------------------------------------

/** Sempre gasta uma comparação de bcrypt, exista ou não a conta: o tempo não revela cadastros. */
async function conferirCredenciais(conta, senha) {
  const senhaConfere = conta
    ? await conferirSenha(senha, conta.senhaHash)
    : await conferirSenhaContraHashFalso(senha);
  if (!conta || !senhaConfere) throw credenciaisInvalidas();
}

async function buscarContaParaLogin(papel, email) {
  switch (papel) {
    case PAPEIS.ADMIN:
      return administradorRepositorio.buscarPorEmailComSenha(email);
    case PAPEIS.PROFISSIONAL:
      return profissionalRepositorio.buscarPorEmailComSenha(email);
    case PAPEIS.PACIENTE:
      return pacienteRepositorio.buscarPorIndiceEmailComSenha(indiceEmailPaciente(email));
    default:
      return null;
  }
}

/** O Super Admin não está no banco: credenciais vêm do .env. Avalia e-mail e senha sempre, sem atalhos. */
async function entrarComoSuperAdmin(email, senha) {
  const emailConfere = igualdadeSegura(email, ambiente.superAdmin.email);
  const senhaConfere = await conferirSenha(senha, await obterHashSuperAdmin());
  if (!emailConfere || !senhaConfere) throw credenciaisInvalidas();
  return emitirSessao(PAPEIS.SUPERADMIN, null);
}

export async function entrar({ papel, email, senha }) {
  if (papel === PAPEIS.SUPERADMIN) return entrarComoSuperAdmin(email, senha);

  const conta = await buscarContaParaLogin(papel, email);
  await conferirCredenciais(conta, senha);

  if (papel === PAPEIS.PROFISSIONAL && !conta.ativo) {
    throw new ErroApp(403, 'CONTA_INATIVA', 'Esta conta está desativada. Procure o administrador da sua organização.');
  }

  const { senhaHash, ...contaSemSenha } = conta;
  return emitirSessao(papel, contaSemSenha);
}

// ---------------------------------------------------------------------------------------------------------
// Sessão (usado pelo middleware `autenticar`)
// ---------------------------------------------------------------------------------------------------------

/**
 * Converte o conteúdo do JWT em `req.usuario`, conferindo no banco que a conta existe, está ativa e que o
 * token não foi revogado. Devolve `null` para qualquer problema (o middleware responde 401).
 */
export async function carregarSessao(carga) {
  if (carga.papel === PAPEIS.SUPERADMIN) {
    if (carga.sub !== PAPEIS.SUPERADMIN) return null;
    return { id: null, papel: PAPEIS.SUPERADMIN, nome: NOME_DO_SUPERADMIN, email: ambiente.superAdmin.email, organizacaoId: null };
  }

  if (!UUID.test(String(carga.sub))) return null;

  switch (carga.papel) {
    case PAPEIS.ADMIN: {
      const conta = await administradorRepositorio.buscarCredencialPorId(carga.sub);
      if (!conta || conta.versaoToken !== carga.ver) return null;
      return { id: conta.id, papel: PAPEIS.ADMIN, nome: conta.nome, email: conta.email, organizacaoId: conta.organizacaoId };
    }
    case PAPEIS.PROFISSIONAL: {
      const conta = await profissionalRepositorio.buscarCredencialPorId(carga.sub);
      if (!conta || !conta.ativo || conta.versaoToken !== carga.ver) return null;
      return { id: conta.id, papel: PAPEIS.PROFISSIONAL, nome: conta.nome, email: conta.email, organizacaoId: conta.organizacaoId };
    }
    case PAPEIS.PACIENTE: {
      const conta = await pacienteRepositorio.buscarCredencialPorId(carga.sub);
      if (!conta || conta.versaoToken !== carga.ver) return null;
      return {
        id: conta.id,
        papel: PAPEIS.PACIENTE,
        nome: conta.nome,
        organizacaoId: conta.organizacaoId,
        profissionalId: conta.profissionalId
      };
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------------------
// Perfil, logout e troca de senha
// ---------------------------------------------------------------------------------------------------------

/** Dados atualizados do usuário logado. */
export async function obterPerfil(usuario) {
  if (usuario.papel === PAPEIS.SUPERADMIN) return descreverUsuario(PAPEIS.SUPERADMIN, null);

  const repositorios = {
    [PAPEIS.ADMIN]: administradorRepositorio,
    [PAPEIS.PROFISSIONAL]: profissionalRepositorio,
    [PAPEIS.PACIENTE]: pacienteRepositorio
  };
  const conta = await repositorios[usuario.papel].buscarPorId(usuario.id);
  return descreverUsuario(usuario.papel, conta);
}

/**
 * "Sair em todos os dispositivos": subir a versão invalida todo JWT emitido antes para esta conta.
 * O token do Super Admin não tem revogação individual (expira em 2 h; trocar SUPERADMIN_SENHA derruba todos).
 */
export async function sair(usuario) {
  switch (usuario.papel) {
    case PAPEIS.ADMIN:
      await administradorRepositorio.incrementarVersaoToken(usuario.id);
      break;
    case PAPEIS.PROFISSIONAL:
      await profissionalRepositorio.incrementarVersaoToken(usuario.id);
      break;
    case PAPEIS.PACIENTE:
      await pacienteRepositorio.incrementarVersaoToken(usuario.id);
      break;
    default:
      break;
  }
}

/**
 * Troca a senha do próprio usuário (exige a atual). Encerra as demais sessões e devolve uma sessão nova,
 * para o dispositivo que trocou a senha continuar logado. Também encerra o estado de "senha temporária".
 */
export async function alterarSenha(usuario, { senhaAtual, novaSenha }) {
  if (usuario.papel === PAPEIS.SUPERADMIN) {
    throw proibido('A senha do Super Administrador é definida na configuração do servidor (SUPERADMIN_SENHA).');
  }

  const repositorios = {
    [PAPEIS.ADMIN]: administradorRepositorio,
    [PAPEIS.PROFISSIONAL]: profissionalRepositorio,
    [PAPEIS.PACIENTE]: pacienteRepositorio
  };
  const repositorio = repositorios[usuario.papel];

  const conta = await repositorio.buscarPorIdComSenha(usuario.id);
  if (!conta || !(await conferirSenha(senhaAtual, conta.senhaHash))) {
    throw new ErroApp(422, 'SENHA_ATUAL_INCORRETA', 'Senha atual incorreta.');
  }

  const alteracoes = { senhaHash: await gerarHashSenha(novaSenha), versaoToken: { increment: 1 } };
  if (usuario.papel !== PAPEIS.ADMIN) alteracoes.senhaTemporaria = false;

  const atualizada = await repositorio.atualizar(usuario.id, alteracoes);
  return emitirSessao(usuario.papel, atualizada);
}
