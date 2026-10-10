import { serializarPacienteResumo } from './paciente.serializador.js';

/** `conteudo` é o conteúdo decifrado: { titulo, mensagem }. `paciente` só aparece na visão do profissional. */
export function serializarNotificacao(notificacao, conteudo) {
  return {
    id: notificacao.id,
    tipo: notificacao.tipo,
    titulo: conteudo.titulo,
    mensagem: conteudo.mensagem,
    lida: notificacao.lida,
    ...(notificacao.paciente ? { paciente: serializarPacienteResumo(notificacao.paciente) } : {}),
    criadoEm: notificacao.criadoEm.toISOString()
  };
}
