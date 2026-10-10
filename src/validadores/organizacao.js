import { z } from 'zod';
import { TIPOS_ORGANIZACAO } from '../config/constantes.js';
import {
  emailEsquema,
  nomeEsquema,
  paginacaoEsquema,
  senhaNovaEsquema,
  textoDeConsulta,
  textoLimpo,
  uuidEsquema,
  vazioComoAusente
} from './comuns.js';

export const esquemaOrganizacao = z
  .object({
    nome: textoLimpo(2, 120, 'Informe o nome da organização.'),
    tipo: z.enum(TIPOS_ORGANIZACAO)
  })
  .strict();

export const consultaOrganizacoes = z.object({
  busca: textoDeConsulta(80),
  tipo: vazioComoAusente(z.enum(TIPOS_ORGANIZACAO).optional()),
  ...paginacaoEsquema()
});

const MENSAGEM_CONFIRMAR = 'Exclusão em cascata (apaga administradores, profissionais, pacientes e históricos). Confirme com ?confirmar=true.';

export const consultaExclusaoOrganizacao = z.object({
  confirmar: z
    .string({ required_error: MENSAGEM_CONFIRMAR })
    .refine((valor) => valor === 'true', MENSAGEM_CONFIRMAR)
});

export const parametrosOrganizacao = z.object({ id: uuidEsquema });

// ---- Administradores (gerenciados pelo Super Admin, que define a senha) ----

export const esquemaNovoAdministrador = z
  .object({ nome: nomeEsquema, email: emailEsquema, senha: senhaNovaEsquema })
  .strict();

export const esquemaAtualizarAdministrador = z
  .object({ nome: nomeEsquema, email: emailEsquema, novaSenha: senhaNovaEsquema.optional() })
  .strict();
