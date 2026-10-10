import { PAPEIS } from '../config/constantes.js';
import * as pacienteRepositorio from '../repositorios/paciente.repositorio.js';
import * as profissionalRepositorio from '../repositorios/profissional.repositorio.js';
import { naoEncontrado } from '../utilitarios/erros.js';

/**
 * Regras de "quem pode enxergar o quê". Toda consulta a um paciente ou profissional por id passa por aqui,
 * para que o isolamento entre organizações (e entre profissionais) seja aplicado num único lugar.
 * Recurso de outra organização/profissional responde 404 (e não 403): não revela que ele existe.
 */

/**
 * Paciente que `ator` pode acessar:
 *  - administrador: qualquer paciente da sua organização;
 *  - profissional: somente os pacientes pelos quais é responsável.
 */
export async function exigirPacienteAcessivel(ator, pacienteId) {
  const paciente = await pacienteRepositorio.buscarAcessivel({
    id: pacienteId,
    organizacaoId: ator.organizacaoId,
    profissionalId: ator.papel === PAPEIS.PROFISSIONAL ? ator.id : undefined
  });
  if (!paciente) throw naoEncontrado('Paciente não encontrado.');
  return paciente;
}

/** Profissional da mesma organização do administrador/ator. */
export async function exigirProfissionalDaOrganizacao(ator, profissionalId) {
  const profissional = await profissionalRepositorio.buscarDaOrganizacao(profissionalId, ator.organizacaoId);
  if (!profissional) throw naoEncontrado('Profissional não encontrado.');
  return profissional;
}
