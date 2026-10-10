import { cifrarJson, decifrarJson, indiceDeBusca } from './cifra.js';
import { contextoCifra } from './contextoCifra.js';

/**
 * Dados pessoais sensíveis do paciente: { sexo, dataNascimento, email }.
 * Ficam em `pacientes.dados_cifrados`; o e-mail também gera um índice cego (`email_indice`) para login e unicidade.
 */

const ESCOPO_INDICE_EMAIL = 'paciente.email';

export const indiceEmailPaciente = (email) => indiceDeBusca(ESCOPO_INDICE_EMAIL, email);

export const cifrarDadosPaciente = (id, dados) => cifrarJson(dados, contextoCifra.paciente(id));

export const decifrarDadosPaciente = (paciente) =>
  decifrarJson(paciente.dadosCifrados, contextoCifra.paciente(paciente.id));
