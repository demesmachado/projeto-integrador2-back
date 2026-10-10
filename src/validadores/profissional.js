import { z } from 'zod';
import { ESPECIALIDADES } from '../config/constantes.js';
import {
  emailEsquema,
  nomeEsquema,
  paginacaoEsquema,
  telefoneEsquema,
  textoDeConsulta,
  textoLimpo,
  vazioComoNulo
} from './comuns.js';

const camposProfissional = {
  nome: nomeEsquema,
  especialidade: z.enum(ESPECIALIDADES),
  // CRM (médicos) ou registro do conselho (COREN etc.): texto livre curto, opcional.
  crm: vazioComoNulo(textoLimpo(3, 30)),
  telefone: vazioComoNulo(telefoneEsquema),
  email: emailEsquema
};

export const esquemaNovoProfissional = z.object(camposProfissional).strict();

/** `ativo: false` bloqueia o acesso sem apagar o histórico clínico. Campos omitidos não são alterados. */
export const esquemaAtualizarProfissional = z.object({ ...camposProfissional, ativo: z.boolean().optional() }).strict();

export const consultaProfissionais = z.object({
  busca: textoDeConsulta(80),
  ...paginacaoEsquema()
});
