import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/consulta.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaDisponiveis,
  consultaHistoricoPaciente,
  consultaMinhasConsultas,
  parametrosConsulta
} from '../validadores/agenda.js';

const roteador = Router();

// Consultas vistas pelo paciente: horários livres do seu profissional, suas solicitações e seu histórico.
roteador.use(autenticar, exigirPapel(PAPEIS.PACIENTE));

roteador.get('/disponiveis', validar({ consulta: consultaDisponiveis }), controlador.listarDisponiveis);

roteador.get('/minhas', validar({ consulta: consultaMinhasConsultas }), controlador.listarMinhas);

roteador.get('/historico', validar({ consulta: consultaHistoricoPaciente }), controlador.listarHistorico);

roteador.post('/:id/solicitar', limitadorEscrita, validar({ parametros: parametrosConsulta }), controlador.solicitar);

roteador.post(
  '/:id/cancelar-solicitacao',
  limitadorEscrita,
  validar({ parametros: parametrosConsulta }),
  controlador.cancelarSolicitacao
);

export default roteador;
