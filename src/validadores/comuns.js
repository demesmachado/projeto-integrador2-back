import { z } from 'zod';
import './mapaErros.js';
import { LIMITES } from '../config/constantes.js';
import { hojeISO } from '../utilitarios/datas.js';
import { apenasDigitos, telefoneValido } from '../utilitarios/telefone.js';
import { limparEspacos } from '../utilitarios/texto.js';

// Postgres recusa o caractere NUL em texto (viraria erro 500): barramos na entrada.
const semCaractereNulo = (valor) => !valor.includes('\u0000');

/** Texto curto de uma linha: espaços colapsados, sem NUL, entre `minimo` e `maximo` caracteres. */
export const textoLimpo = (minimo, maximo, mensagemMinimo) =>
  z
    .string()
    .transform(limparEspacos)
    .pipe(
      z
        .string()
        .min(minimo, mensagemMinimo)
        .max(maximo)
        .refine(semCaractereNulo, 'Texto contém caracteres inválidos.')
    );

/** Texto longo (observações, mensagens): preserva quebras de linha; só apara as pontas. */
export const textoLivre = (minimo, maximo, mensagemMinimo) =>
  z
    .string()
    .transform((valor) => valor.replace(/\r\n/g, '\n').trim())
    .pipe(
      z
        .string()
        .min(minimo, mensagemMinimo)
        .max(maximo)
        .refine(semCaractereNulo, 'Texto contém caracteres inválidos.')
    );

/** Campo opcional: texto vazio ("") equivale a "sem valor" (null). */
export const vazioComoNulo = (esquema) =>
  z.preprocess((valor) => (typeof valor === 'string' && valor.trim() === '' ? null : valor), esquema.nullable().optional());

export const nomeEsquema = textoLimpo(2, 120, 'Informe o nome completo.');

export const emailEsquema = z.string().trim().toLowerCase().max(254).email('E-mail inválido.');

export const telefoneEsquema = z
  .string()
  .max(20)
  .refine(telefoneValido, 'Telefone inválido. Use DDD + número.')
  .transform(apenasDigitos);

/** Data AAAA-MM-DD real do calendário (rejeita 2026-02-31). Devolve o próprio texto. */
export const dataIsoEsquema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .refine((valor) => {
    const data = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
  }, 'Data inválida.');

export const dataNascimentoEsquema = dataIsoEsquema.refine(
  (valor) => valor <= hojeISO() && valor >= '1900-01-01',
  'Data de nascimento fora do intervalo permitido.'
);

export const horaEsquema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM (00:00 a 23:59).');

/** Senha NOVA (cadastro de admin, troca, redefinição). No login não se aplica a regra de tamanho mínimo. */
export const senhaNovaEsquema = z
  .string()
  .min(LIMITES.senhaMinima, `A senha deve ter ao menos ${LIMITES.senhaMinima} caracteres.`)
  .refine(
    (valor) => Buffer.byteLength(valor) <= LIMITES.senhaMaximaBytes,
    `A senha deve ter no máximo ${LIMITES.senhaMaximaBytes} bytes.`
  );

export const senhaAtualEsquema = z.string().min(1, 'Informe a senha atual.').max(128);

// ---- Parâmetros de rota e de consulta (query string) ----

export const uuidEsquema = z.string().uuid('Identificador inválido.');

export const parametrosIdEsquema = z.object({ id: uuidEsquema });

/** Query string vazia (?campo=) equivale a campo ausente: é como o front envia filtros em branco. */
export const vazioComoAusente = (esquema) => z.preprocess((valor) => (valor === '' ? undefined : valor), esquema);

export const textoDeConsulta = (maximo) =>
  vazioComoAusente(
    z
      .string()
      .trim()
      .max(maximo)
      .refine(semCaractereNulo, 'Texto contém caracteres inválidos.')
      .optional()
  );

export const booleanoDeConsulta = vazioComoAusente(
  z
    .enum(['true', 'false'])
    .transform((valor) => valor === 'true')
    .optional()
);

export const paginacaoEsquema = (limitePadrao = LIMITES.paginaPadrao, limiteMaximo = LIMITES.paginaMaxima) => ({
  pagina: vazioComoAusente(z.coerce.number().int().min(1).max(100_000).default(1)),
  limite: vazioComoAusente(z.coerce.number().int().min(1).max(limiteMaximo).default(limitePadrao))
});
