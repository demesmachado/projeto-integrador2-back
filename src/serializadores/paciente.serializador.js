import { calcularIdade } from '../utilitarios/datas.js';
import { serializarProfissionalResumo } from './profissional.serializador.js';

/**
 * `dados` é o conteúdo já decifrado de `pacientes.dados_cifrados`: { sexo, dataNascimento, email }.
 * O serializador nunca recebe nem devolve hash de senha, índice de e-mail ou texto cifrado.
 */
export function serializarPaciente(paciente, dados) {
  return {
    id: paciente.id,
    nome: paciente.nome,
    sexo: dados.sexo,
    dataNascimento: dados.dataNascimento,
    idade: calcularIdade(dados.dataNascimento),
    email: dados.email,
    organizacaoId: paciente.organizacaoId,
    profissional: serializarProfissionalResumo(paciente.profissional),
    senhaTemporaria: paciente.senhaTemporaria,
    criadoEm: paciente.criadoEm.toISOString()
  };
}

/** Versão enxuta para listas e vínculos: só o necessário para identificar a pessoa. */
export function serializarPacienteResumo(paciente) {
  if (!paciente) return null;
  return { id: paciente.id, nome: paciente.nome };
}
