import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/conteudo.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaConteudos,
  consultaRecomendados,
  esquemaConteudo,
  parametrosConteudo
} from '../validadores/conteudo.js';

const roteador = Router();

const somenteProfissional = exigirPapel(PAPEIS.PROFISSIONAL);

roteador.use(autenticar);

// Paciente: os conteúdos que o profissional recomendou a ele (rota fixa antes das rotas com :id).
roteador.get(
  '/recomendados',
  exigirPapel(PAPEIS.PACIENTE),
  validar({ consulta: consultaRecomendados }),
  controlador.listarRecomendados
);

// Profissional: biblioteca de cursos, livros, documentários e artigos.
roteador.get('/', somenteProfissional, validar({ consulta: consultaConteudos }), controlador.listar);

roteador.post('/', somenteProfissional, limitadorEscrita, corpoJson(), validar({ corpo: esquemaConteudo }), controlador.criar);

roteador.put(
  '/:id',
  somenteProfissional,
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosConteudo, corpo: esquemaConteudo }),
  controlador.atualizar
);

roteador.delete(
  '/:id',
  somenteProfissional,
  limitadorEscrita,
  validar({ parametros: parametrosConteudo }),
  controlador.excluir
);

export default roteador;
