import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/notificacao.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaMinhasNotificacoes,
  consultaNotificacoesDoProfissional,
  esquemaAtualizarNotificacao,
  esquemaNovaNotificacao,
  parametrosNotificacao
} from '../validadores/notificacao.js';

const roteador = Router();

const somenteProfissional = exigirPapel(PAPEIS.PROFISSIONAL);
const somentePaciente = exigirPapel(PAPEIS.PACIENTE);

roteador.use(autenticar);

// ---- Paciente (rotas fixas antes das rotas com :id) ----

roteador.get('/minhas', somentePaciente, validar({ consulta: consultaMinhasNotificacoes }), controlador.listarMinhas);

roteador.get('/minhas/nao-lidas', somentePaciente, controlador.contarNaoLidas);

roteador.post('/lidas', somentePaciente, limitadorEscrita, controlador.marcarTodasComoLidas);

roteador.post(
  '/:id/lida',
  somentePaciente,
  limitadorEscrita,
  validar({ parametros: parametrosNotificacao }),
  controlador.marcarComoLida
);

// ---- Profissional ----

roteador.get(
  '/',
  somenteProfissional,
  validar({ consulta: consultaNotificacoesDoProfissional }),
  controlador.listarEnviadas
);

roteador.post(
  '/',
  somenteProfissional,
  limitadorEscrita,
  corpoJson(),
  validar({ corpo: esquemaNovaNotificacao }),
  controlador.enviar
);

roteador.put(
  '/:id',
  somenteProfissional,
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosNotificacao, corpo: esquemaAtualizarNotificacao }),
  controlador.corrigir
);

roteador.delete(
  '/:id',
  somenteProfissional,
  limitadorEscrita,
  validar({ parametros: parametrosNotificacao }),
  controlador.excluir
);

export default roteador;
