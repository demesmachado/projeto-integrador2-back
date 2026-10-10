import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/profissional.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { parametrosIdEsquema } from '../validadores/comuns.js';
import {
  consultaProfissionais,
  esquemaAtualizarProfissional,
  esquemaNovoProfissional
} from '../validadores/profissional.js';

const roteador = Router();

// Gestão dos profissionais da própria organização: exclusivo do administrador.
roteador.use(autenticar, exigirPapel(PAPEIS.ADMIN));

roteador.get('/', validar({ consulta: consultaProfissionais }), controlador.listar);

roteador.post('/', limitadorEscrita, corpoJson(), validar({ corpo: esquemaNovoProfissional }), controlador.criar);

roteador.get('/:id', validar({ parametros: parametrosIdEsquema }), controlador.obter);

roteador.put(
  '/:id',
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosIdEsquema, corpo: esquemaAtualizarProfissional }),
  controlador.atualizar
);

roteador.delete('/:id', limitadorEscrita, validar({ parametros: parametrosIdEsquema }), controlador.excluir);

roteador.post(
  '/:id/redefinir-senha',
  limitadorEscrita,
  validar({ parametros: parametrosIdEsquema }),
  controlador.redefinirSenha
);

export default roteador;
