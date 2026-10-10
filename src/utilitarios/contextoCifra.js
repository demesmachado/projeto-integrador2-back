/**
 * Contexto (AAD) de cada dado cifrado: "tabela.coluna:id". Prende o conteúdo cifrado à sua linha de origem.
 * Mudar estes textos tornaria ilegíveis os dados já gravados: nunca renomeie depois de ir para produção.
 */
export const contextoCifra = Object.freeze({
  paciente: (id) => `pacientes.dados:${id}`,
  consulta: (id) => `consultas.dados_clinicos:${id}`,
  evolucao: (id) => `evolucoes.dados:${id}`,
  notificacao: (id) => `notificacoes.conteudo:${id}`
});
