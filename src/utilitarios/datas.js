import { FUSO_HORARIO } from '../config/constantes.js';

// 'en-CA' formata como AAAA-MM-DD, que é o formato de data usado em toda a API.
const formatadorDeDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

/** "Hoje" no fuso do negócio (não no do servidor, que costuma ser UTC), como AAAA-MM-DD. */
export const hojeISO = () => formatadorDeDia.format(new Date());

/** Coluna DATE do Postgres ⇄ texto AAAA-MM-DD. Sempre em UTC para não "voltar um dia". */
export const isoParaData = (iso) => new Date(`${iso}T00:00:00.000Z`);
export const dataParaISO = (data) => data.toISOString().slice(0, 10);

export function calcularIdade(isoNascimento, hoje = hojeISO()) {
  if (!isoNascimento) return null;
  const [anoN, mesN, diaN] = isoNascimento.split('-').map(Number);
  const [anoH, mesH, diaH] = hoje.split('-').map(Number);
  let idade = anoH - anoN;
  if (mesH < mesN || (mesH === mesN && diaH < diaN)) idade -= 1;
  return idade;
}
