import { z } from 'zod';
import { TIPOS_NOTIFICACAO } from '../config/constantes.js';
import {
  booleanoDeConsulta,
  paginacaoEsquema,
  textoLimpo,
  textoLivre,
  uuidEsquema,
  vazioComoAusente
} from './comuns.js';

const tipoEsquema = z.enum(Object.values(TIPOS_NOTIFICACAO));

const camposConteudo = {
  tipo: tipoEsquema,
  titulo: textoLimpo(1, 150, 'Informe o título.'),
  mensagem: textoLivre(1, 2000, 'Informe a mensagem.')
};

export const esquemaNovaNotificacao = z.object({ pacienteId: uuidEsquema, ...camposConteudo }).strict();

/** O destinatário não muda depois de enviada; só o conteúdo pode ser corrigido. */
export const esquemaAtualizarNotificacao = z.object(camposConteudo).strict();

export const consultaNotificacoesDoProfissional = z.object({
  pacienteId: vazioComoAusente(uuidEsquema.optional()),
  tipo: vazioComoAusente(tipoEsquema.optional()),
  ...paginacaoEsquema()
});

export const consultaMinhasNotificacoes = z.object({
  apenasNaoLidas: booleanoDeConsulta,
  ...paginacaoEsquema()
});

export const parametrosNotificacao = z.object({ id: uuidEsquema });
