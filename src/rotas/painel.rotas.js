import { Router } from 'express';
import * as controlador from '../controladores/painel.controlador.js';
import { autenticar } from '../middlewares/autenticar.js';

const roteador = Router();

// Qualquer perfil autenticado: cada um recebe o painel do seu próprio perfil.
roteador.get('/', autenticar, controlador.obterPainel);

export default roteador;
