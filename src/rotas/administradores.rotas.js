import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/organizacao.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { esquemaAtualizarAdministrador, parametrosOrganizacao } from '../validadores/organizacao.js';

const roteador = Router();

// Edição/exclusão de um administrador pelo id (a criação e a listagem ficam em /organizacoes/:id/administradores).
roteador.use(autenticar, exigirPapel(PAPEIS.SUPERADMIN));

roteador.put(
  '/:id',
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosOrganizacao, corpo: esquemaAtualizarAdministrador }),
  controlador.atualizarAdministrador
);

roteador.delete(
  '/:id',
  limitadorEscrita,
  validar({ parametros: parametrosOrganizacao }),
  controlador.excluirAdministrador
);

export default roteador;
