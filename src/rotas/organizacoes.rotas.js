import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/organizacao.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaExclusaoOrganizacao,
  consultaOrganizacoes,
  esquemaNovoAdministrador,
  esquemaOrganizacao,
  parametrosOrganizacao
} from '../validadores/organizacao.js';

const roteador = Router();

// Organizações e seus administradores: exclusivo do Super Administrador.
roteador.use(autenticar, exigirPapel(PAPEIS.SUPERADMIN));

roteador.get('/', validar({ consulta: consultaOrganizacoes }), controlador.listar);

roteador.post('/', limitadorEscrita, corpoJson(), validar({ corpo: esquemaOrganizacao }), controlador.criar);

roteador.get('/:id', validar({ parametros: parametrosOrganizacao }), controlador.obter);

roteador.put(
  '/:id',
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosOrganizacao, corpo: esquemaOrganizacao }),
  controlador.atualizar
);

roteador.delete(
  '/:id',
  limitadorEscrita,
  validar({ parametros: parametrosOrganizacao, consulta: consultaExclusaoOrganizacao }),
  controlador.excluir
);

roteador.get('/:id/administradores', validar({ parametros: parametrosOrganizacao }), controlador.listarAdministradores);

roteador.post(
  '/:id/administradores',
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosOrganizacao, corpo: esquemaNovoAdministrador }),
  controlador.criarAdministrador
);

export default roteador;
