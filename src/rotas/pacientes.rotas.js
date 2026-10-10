import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as conteudoControlador from '../controladores/conteudo.controlador.js';
import * as controlador from '../controladores/paciente.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaEvolucoes,
  consultaHistorico,
  consultaPacientes,
  esquemaAtualizarPaciente,
  esquemaNovaEvolucao,
  esquemaNovaRecomendacao,
  esquemaNovoPaciente,
  parametrosPaciente,
  parametrosRecomendacao
} from '../validadores/paciente.js';
import { consultaRecomendados } from '../validadores/conteudo.js';

const roteador = Router();

const administracao = exigirPapel(PAPEIS.ADMIN, PAPEIS.PROFISSIONAL);
const somenteAdmin = exigirPapel(PAPEIS.ADMIN);
const somenteProfissional = exigirPapel(PAPEIS.PROFISSIONAL);

roteador.use(autenticar);

// ---- Cadastro (administrador: qualquer paciente da organização; profissional: apenas os seus) ----

roteador.get('/', administracao, validar({ consulta: consultaPacientes }), controlador.listar);

roteador.post('/', administracao, limitadorEscrita, corpoJson(), validar({ corpo: esquemaNovoPaciente }), controlador.criar);

roteador.get('/:id', administracao, validar({ parametros: parametrosPaciente }), controlador.obter);

roteador.put(
  '/:id',
  administracao,
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosPaciente, corpo: esquemaAtualizarPaciente }),
  controlador.atualizar
);

// Excluir apaga também todo o histórico clínico do paciente: só o administrador.
roteador.delete('/:id', somenteAdmin, limitadorEscrita, validar({ parametros: parametrosPaciente }), controlador.excluir);

roteador.post(
  '/:id/redefinir-senha',
  administracao,
  limitadorEscrita,
  validar({ parametros: parametrosPaciente }),
  controlador.redefinirSenha
);

// ---- Ficha clínica (somente o profissional responsável) ----

roteador.get(
  '/:id/historico',
  somenteProfissional,
  validar({ parametros: parametrosPaciente, consulta: consultaHistorico }),
  controlador.listarHistorico
);

roteador.get(
  '/:id/evolucoes',
  somenteProfissional,
  validar({ parametros: parametrosPaciente, consulta: consultaEvolucoes }),
  controlador.listarEvolucoes
);

roteador.post(
  '/:id/evolucoes',
  somenteProfissional,
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosPaciente, corpo: esquemaNovaEvolucao }),
  controlador.criarEvolucao
);

// ---- Conteúdos recomendados ao paciente ----

roteador.get(
  '/:id/recomendacoes',
  somenteProfissional,
  validar({ parametros: parametrosPaciente, consulta: consultaRecomendados }),
  conteudoControlador.listarRecomendacoes
);

roteador.post(
  '/:id/recomendacoes',
  somenteProfissional,
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosPaciente, corpo: esquemaNovaRecomendacao }),
  conteudoControlador.recomendar
);

roteador.delete(
  '/:id/recomendacoes/:recomendacaoId',
  somenteProfissional,
  limitadorEscrita,
  validar({ parametros: parametrosRecomendacao }),
  conteudoControlador.removerRecomendacao
);

export default roteador;
