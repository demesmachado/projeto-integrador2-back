import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';
import { ambiente } from '../config/ambiente.js';

/**
 * Criptografia dos dados sensíveis em repouso (dados de pacientes, consultas, evoluções, notificações).
 *
 * - AES-256-GCM (criptografia autenticada): além de esconder o conteúdo, detecta qualquer adulteração.
 * - IV aleatório de 96 bits por operação; o mesmo texto nunca gera o mesmo resultado.
 * - AAD (dado associado) = "tabela.coluna:id do registro": o resultado só decifra no registro de origem,
 *   então trocar o conteúdo cifrado de uma linha para outra no banco é detectado.
 * - Formato guardado: `v1.<iv>.<tag>.<conteúdo>` (base64url). O prefixo de versão permite rotacionar a chave no futuro.
 * - As subchaves são derivadas por HKDF da CHAVE_CRIPTOGRAFIA: a de cifra e a de índice nunca são a mesma.
 */

const VERSAO = 'v1';
const SAL = 'saude-digital/sal-cifra-v1';

const derivarChave = (finalidade) =>
  Buffer.from(hkdfSync('sha256', ambiente.chaveCriptografia, SAL, finalidade, 32));

const chaveDados = derivarChave('dados-aes-256-gcm');
const chaveIndice = derivarChave('indice-hmac-sha256');

/** Cifra um valor serializável em JSON. `contexto` identifica o registro, ex.: `pacientes.dados:<id>`. */
export function cifrarJson(valor, contexto) {
  const iv = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm', chaveDados, iv);
  cifra.setAAD(Buffer.from(contexto, 'utf8'));
  const conteudo = Buffer.concat([cifra.update(JSON.stringify(valor), 'utf8'), cifra.final()]);
  const etiqueta = cifra.getAuthTag();
  return [VERSAO, iv.toString('base64url'), etiqueta.toString('base64url'), conteudo.toString('base64url')].join('.');
}

/** Decifra e devolve o valor original. Lança se o formato, a chave, o contexto ou a integridade não conferirem. */
export function decifrarJson(texto, contexto) {
  const partes = String(texto ?? '').split('.');
  if (partes.length !== 4 || partes[0] !== VERSAO) throw new Error('Formato de dado cifrado desconhecido.');

  const [, iv, etiqueta, conteudo] = partes.map((parte, i) => (i === 0 ? parte : Buffer.from(parte, 'base64url')));
  const decifra = createDecipheriv('aes-256-gcm', chaveDados, iv);
  decifra.setAAD(Buffer.from(contexto, 'utf8'));
  decifra.setAuthTag(etiqueta);
  const claro = Buffer.concat([decifra.update(conteudo), decifra.final()]);
  return JSON.parse(claro.toString('utf8'));
}

/**
 * Índice de busca "cego": HMAC-SHA256 determinístico. Permite localizar/comparar um valor (ex.: e-mail do
 * paciente) sem guardá-lo em texto e sem que um vazamento do banco permita testar e-mails por força bruta.
 */
export function indiceDeBusca(escopo, valor) {
  return createHmac('sha256', chaveIndice).update(`${escopo}\u0000${valor}`).digest('hex');
}
