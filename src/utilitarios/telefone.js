/** Normalização, validação e formatação de telefone (armazenado só com dígitos). */

export const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

export function telefoneValido(valor) {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== 10 && digitos.length !== 11) return false;
  if (digitos[0] === '0' || digitos[1] === '0') return false; // DDD inválido
  return digitos.length === 10 || digitos[2] === '9'; // celular tem o 9 na frente
}

export function formatarTelefone(digitos) {
  const d = apenasDigitos(digitos);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
