import { ambiente } from '../config/ambiente.js';

/**
 * Log estruturado (uma linha JSON por evento). Regra: nunca registrar corpo de requisição, senhas,
 * tokens, query string nem dados pessoais/de saúde. Só metadados técnicos.
 */
function escrever(nivel, mensagem, contexto = {}) {
  if (ambiente.ehTeste) return;
  const linha = JSON.stringify({ hora: new Date().toISOString(), nivel, mensagem, ...contexto });
  (nivel === 'erro' ? process.stderr : process.stdout).write(`${linha}\n`);
}

export const registrador = {
  info: (mensagem, contexto) => escrever('info', mensagem, contexto),
  aviso: (mensagem, contexto) => escrever('aviso', mensagem, contexto),
  erro: (mensagem, contexto) => escrever('erro', mensagem, contexto)
};

/**
 * Resume um erro sem vazar dados: mensagens de erros do Prisma podem trazer os argumentos da consulta
 * (inclusive hash de senha e dados cifrados), então só o código e a primeira linha são mantidos.
 */
export function resumirErro(erro) {
  const primeiraLinha = String(erro?.message ?? '').split('\n')[0].slice(0, 300);
  const ehPrisma = erro?.name?.startsWith('PrismaClient');
  return {
    tipo: erro?.name,
    codigo: erro?.code,
    mensagem: ehPrisma ? undefined : primeiraLinha,
    pilha: ambiente.ehProducao || ehPrisma ? undefined : String(erro?.stack ?? '').split('\n').slice(0, 6).join('\n')
  };
}
