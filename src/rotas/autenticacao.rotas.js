import { Router } from 'express';
import * as controlador from '../controladores/autenticacao.controlador.js';
import { autenticar } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorLoginPorConta, limitadorLoginPorIp, limitadorTrocaDeSenha } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { esquemaAlterarSenha, esquemaEntrar } from '../validadores/autenticacao.js';

const roteador = Router();

// Ordem importa: limite por IP → ler corpo → validar → limite por conta → autenticar.
roteador.post(
  '/entrar',
  limitadorLoginPorIp,
  corpoJson(),
  validar({ corpo: esquemaEntrar }),
  limitadorLoginPorConta,
  controlador.entrar
);

roteador.post('/sair', autenticar, controlador.sair);

roteador.get('/eu', autenticar, controlador.obterPerfil);

roteador.put(
  '/senha',
  autenticar,
  limitadorTrocaDeSenha,
  corpoJson(),
  validar({ corpo: esquemaAlterarSenha }),
  controlador.alterarSenha
);

export default roteador;
