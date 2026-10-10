import { z } from 'zod';
import { INDICADORES_BEM_ESTAR, SEXOS } from '../config/constantes.js';
import {
  dataNascimentoEsquema,
  emailEsquema,
  nomeEsquema,
  paginacaoEsquema,
  textoDeConsulta,
  textoLivre,
  uuidEsquema,
  vazioComoAusente
} from './comuns.js';

const camposPaciente = {
  nome: nomeEsquema,
  sexo: z.enum(SEXOS),
  dataNascimento: dataNascimentoEsquema,
  email: emailEsquema
};

/** `profissionalId` é usado pelo administrador; o profissional que cadastra fica automaticamente como responsável. */
export const esquemaNovoPaciente = z
  .object({ ...camposPaciente, profissionalId: uuidEsquema.nullable().optional() })
  .strict();

/** `profissionalId`: omitido mantém o atual; `null` remove o vínculo. */
export const esquemaAtualizarPaciente = z
  .object({ ...camposPaciente, profissionalId: uuidEsquema.nullable().optional() })
  .strict();

export const consultaPacientes = z.object({
  busca: textoDeConsulta(80),
  profissionalId: vazioComoAusente(uuidEsquema.optional()),
  ...paginacaoEsquema()
});

export const parametrosPaciente = z.object({ id: uuidEsquema });

// ---- Evolução clínica ----

export const esquemaNovaEvolucao = z
  .object({
    indicadorBemEstar: z.enum(INDICADORES_BEM_ESTAR),
    texto: textoLivre(1, 2000, 'Escreva a nota de evolução.')
  })
  .strict();

export const consultaEvolucoes = z.object({ ...paginacaoEsquema() });

// ---- Histórico de consultas do paciente (visão do profissional/administrador) ----

export const consultaHistorico = z.object({ ...paginacaoEsquema() });

// ---- Recomendação de conteúdo ----

export const esquemaNovaRecomendacao = z.object({ conteudoId: uuidEsquema }).strict();

export const parametrosRecomendacao = z.object({ id: uuidEsquema, recomendacaoId: uuidEsquema });
