/**
 * Cálculos e classificações de indicadores de saúde.
 * As faixas são de referência simplificada, para demonstração: não substituem avaliação clínica.
 */

export function calcularImc(pesoKg, alturaM) {
  if (!pesoKg || !alturaM) return null;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

export function classificarImc(imc) {
  if (imc === null || imc === undefined) return null;
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidade';
}

/** Frequência cardíaca em repouso (bpm). */
export function classificarFrequenciaCardiaca(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor >= 60 && valor <= 80) return 'Ótimo';
  if ((valor >= 50 && valor < 60) || (valor > 80 && valor <= 100)) return 'Bom';
  if ((valor >= 40 && valor < 50) || (valor > 100 && valor <= 110)) return 'Regular';
  return 'Ruim';
}

/** Glicemia em jejum (mg/dL). Faixas contíguas: uma média como 99,5 cai em "Ótimo", não em lacuna. */
export function classificarGlicemia(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor >= 70 && valor < 100) return 'Ótimo';
  if (valor >= 100 && valor < 126) return 'Bom';
  if (valor >= 126 && valor <= 160) return 'Regular';
  return 'Ruim';
}

/** Média com 1 casa decimal; `null` se não houver valores. */
export function media(numeros) {
  if (numeros.length === 0) return null;
  const soma = numeros.reduce((acumulado, valor) => acumulado + valor, 0);
  return Math.round((soma / numeros.length) * 10) / 10;
}
