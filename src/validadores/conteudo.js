import { z } from 'zod';
import { TIPOS_CONTEUDO } from '../config/constantes.js';
import {
  paginacaoEsquema,
  textoDeConsulta,
  textoLimpo,
  textoLivre,
  uuidEsquema,
  vazioComoAusente,
  vazioComoNulo
} from './comuns.js';

const tipoEsquema = z.enum(TIPOS_CONTEUDO);

/** Só http/https: bloqueia `javascript:`, `data:` e afins, que virariam XSS quando o front criar o link. */
const urlEsquema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((valor) => ['http:', 'https:'].includes(new URL(valor).protocol), 'Use um endereço http:// ou https://.');

const camposConteudo = {
  titulo: textoLimpo(2, 150, 'Informe o título.'),
  tipo: tipoEsquema,
  descricao: textoLivre(1, 1000, 'Informe a descrição.'),
  url: vazioComoNulo(urlEsquema)
};

export const esquemaConteudo = z.object(camposConteudo).strict();

export const consultaConteudos = z.object({
  tipo: vazioComoAusente(tipoEsquema.optional()),
  busca: textoDeConsulta(80),
  ...paginacaoEsquema()
});

export const consultaRecomendados = z.object({ ...paginacaoEsquema() });

export const parametrosConteudo = z.object({ id: uuidEsquema });
