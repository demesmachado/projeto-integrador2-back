import { Router } from 'express';
import { verificarSaude } from '../controladores/saude.controlador.js';
import rotasAdministradores from './administradores.rotas.js';
import rotasAgenda from './agenda.rotas.js';
import rotasAutenticacao from './autenticacao.rotas.js';
import rotasConsultas from './consultas.rotas.js';
import rotasConteudos from './conteudos.rotas.js';
import rotasNotificacoes from './notificacoes.rotas.js';
import rotasOrganizacoes from './organizacoes.rotas.js';
import rotasPacientes from './pacientes.rotas.js';
import rotasPainel from './painel.rotas.js';
import rotasProfissionais from './profissionais.rotas.js';

const roteador = Router();

// Respostas da API têm dados pessoais e de saúde: nunca devem ser guardadas em cache.
roteador.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

roteador.get('/saude', verificarSaude);
roteador.use('/autenticacao', rotasAutenticacao);
roteador.use('/painel', rotasPainel);
roteador.use('/organizacoes', rotasOrganizacoes);
roteador.use('/administradores', rotasAdministradores);
roteador.use('/profissionais', rotasProfissionais);
roteador.use('/pacientes', rotasPacientes);
roteador.use('/agenda', rotasAgenda);
roteador.use('/consultas', rotasConsultas);
roteador.use('/notificacoes', rotasNotificacoes);
roteador.use('/conteudos', rotasConteudos);

export default roteador;
