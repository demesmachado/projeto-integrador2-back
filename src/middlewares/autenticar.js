import * as autenticacaoServico from '../servicos/autenticacao.servico.js';
import { ErroApp, naoAutenticado } from '../utilitarios/erros.js';
import { verificarToken } from '../utilitarios/token.js';

function lerTokenDoCabecalho(req) {
  const [esquema, token, ...sobra] = (req.get('authorization') ?? '').split(' ');
  if (esquema?.toLowerCase() !== 'bearer' || !token || sobra.length > 0) return null;
  return token;
}

function recusar(mensagem) {
  const erro = naoAutenticado(mensagem);
  erro.cabecalhos = { 'WWW-Authenticate': 'Bearer' };
  return erro;
}

/**
 * Exige `Authorization: Bearer <jwt>` e popula `req.usuario = { id, papel, nome, email, organizacaoId, ... }`.
 * Além da assinatura, confere no banco que a conta ainda existe, está ativa e que o token não foi revogado
 * (versão do token): excluir a conta, desativá-la ou fazer logout derruba o acesso na hora, não só no vencimento.
 */
export async function autenticar(req, res, next) {
  const token = lerTokenDoCabecalho(req);
  if (!token) throw recusar('Token de acesso ausente.');

  let carga;
  try {
    carga = verificarToken(token);
  } catch {
    throw recusar('Token inválido ou expirado.');
  }

  const usuario = await autenticacaoServico.carregarSessao(carga);
  if (!usuario) throw recusar('Sessão encerrada. Faça login novamente.');

  req.usuario = usuario;
  return next();
}

/** Autorização por perfil. Use sempre depois de `autenticar`. */
export const exigirPapel =
  (...papeisPermitidos) =>
  (req, res, next) => {
    if (!papeisPermitidos.includes(req.usuario?.papel)) {
      throw new ErroApp(403, 'PROIBIDO', 'Seu perfil não tem permissão para acessar este recurso.');
    }
    next();
  };
