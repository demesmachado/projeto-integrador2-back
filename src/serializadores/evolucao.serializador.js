import { serializarProfissionalResumo } from './profissional.serializador.js';

/** `dados` é o conteúdo decifrado: { texto, indicadorBemEstar }. */
export function serializarEvolucao(evolucao, dados) {
  return {
    id: evolucao.id,
    pacienteId: evolucao.pacienteId,
    texto: dados.texto,
    indicadorBemEstar: dados.indicadorBemEstar,
    profissional: serializarProfissionalResumo(evolucao.profissional),
    criadoEm: evolucao.criadoEm.toISOString()
  };
}
