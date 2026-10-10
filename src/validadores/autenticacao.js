import { z } from 'zod';
import { PAPEIS } from '../config/constantes.js';
import { emailEsquema, senhaAtualEsquema, senhaNovaEsquema } from './comuns.js';

export const esquemaEntrar = z
  .object({
    papel: z.enum(Object.values(PAPEIS)),
    email: emailEsquema,
    senha: z.string().min(1, 'Informe a senha.').max(128)
  })
  .strict();

export const esquemaAlterarSenha = z
  .object({ senhaAtual: senhaAtualEsquema, novaSenha: senhaNovaEsquema })
  .strict()
  .refine((dados) => dados.senhaAtual !== dados.novaSenha, {
    message: 'A nova senha deve ser diferente da atual.',
    path: ['novaSenha']
  });
