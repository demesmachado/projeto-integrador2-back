/** Aparar e colapsar espaços internos repetidos. */
export function limparEspacos(texto) {
  return String(texto ?? '').trim().replace(/\s+/g, ' ');
}
