import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/agenda.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaAgenda,
  esquemaNovoHorario,
  esquemaRegistrarConsulta,
  parametrosConsulta
} from '../validadores/agenda.js';

const roteador = Router();

// Agenda do profissional (horários, solicitações e atendimentos).
roteador.use(autenticar, exigirPapel(PAPEIS.PROFISSIONAL));

roteador.get('/', validar({ consulta: consultaAgenda }), controlador.listar);

roteador.post('/', limitadorEscrita, corpoJson(), validar({ corpo: esquemaNovoHorario }), controlador.criarHorario);

roteador.get('/:id', validar({ parametros: parametrosConsulta }), controlador.obter);

roteador.post('/:id/confirmar', limitadorEscrita, validar({ parametros: parametrosConsulta }), controlador.confirmar);

roteador.post('/:id/recusar', limitadorEscrita, validar({ parametros: parametrosConsulta }), controlador.recusar);

roteador.post('/:id/cancelar', limitadorEscrita, validar({ parametros: parametrosConsulta }), controlador.cancelar);

roteador.post(
  '/:id/registrar',
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosConsulta, corpo: esquemaRegistrarConsulta }),
  controlador.registrar
);

roteador.delete('/:id', limitadorEscrita, validar({ parametros: parametrosConsulta }), controlador.excluir);

export default roteador;
