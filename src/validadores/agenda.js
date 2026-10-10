import { z } from 'zod';
import { ATIVIDADES_FISICAS, HABITOS_SONO, STATUS_CONSULTA } from '../config/constantes.js';
import {
  dataIsoEsquema,
  horaEsquema,
  paginacaoEsquema,
  textoDeConsulta,
  textoLivre,
  uuidEsquema,
  vazioComoAusente,
  vazioComoNulo
} from './comuns.js';

const statusEsquema = z.enum(Object.values(STATUS_CONSULTA));

// ---- Agenda do profissional ----

export const esquemaNovoHorario = z.object({ data: dataIsoEsquema, hora: horaEsquema }).strict();

export const consultaAgenda = z.object({
  status: vazioComoAusente(statusEsquema.optional()),
  busca: textoDeConsulta(80),
  de: vazioComoAusente(dataIsoEsquema.optional()),
  ate: vazioComoAusente(dataIsoEsquema.optional()),
  ...paginacaoEsquema()
});

export const parametrosConsulta = z.object({ id: uuidEsquema });

/** Número clínico opcional: aceita número JSON, texto numérico ("68,5") ou vazio (= não informado). */
const numeroClinico = (minimo, maximo, { inteiro = false } = {}) => {
  let numero = z.number().min(minimo).max(maximo);
  if (inteiro) numero = numero.int('Informe um número inteiro.');
  return z.preprocess((valor) => {
    if (valor === '' || valor === null) return null;
    if (typeof valor === 'string') return Number(valor.trim().replace(',', '.'));
    return valor;
  }, numero.nullable().optional());
};

const pressaoArterialEsquema = z.preprocess(
  (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, '') || null : valor),
  z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, 'Use o formato 120/80.')
    .refine((valor) => {
      const [sistolica, diastolica] = valor.split('/').map(Number);
      return sistolica > diastolica && sistolica <= 300 && diastolica >= 20;
    }, 'Valores de pressão arterial incoerentes.')
    .nullable()
    .optional()
);

/**
 * Dados clínicos da consulta. TODOS opcionais (depende de cada atendimento). O IMC não é aceito do cliente:
 * o servidor calcula a partir de peso e altura.
 */
export const esquemaRegistrarConsulta = z
  .object({
    peso: numeroClinico(1, 500), // kg
    altura: numeroClinico(0.3, 2.8), // metros
    pressaoArterial: pressaoArterialEsquema, // mmHg
    frequenciaCardiaca: numeroClinico(20, 300, { inteiro: true }), // bpm
    glicemia: numeroClinico(10, 1500), // mg/dL
    habitosSono: vazioComoNulo(z.enum(HABITOS_SONO)),
    atividadeFisica: vazioComoNulo(z.enum(ATIVIDADES_FISICAS)),
    alimentacao: vazioComoNulo(textoLivre(1, 2000)),
    observacoes: vazioComoNulo(textoLivre(1, 2000))
  })
  .strict();

// ---- Consultas do paciente ----

export const consultaDisponiveis = z.object({ ...paginacaoEsquema() });

export const consultaMinhasConsultas = z.object({
  status: vazioComoAusente(statusEsquema.optional()),
  ...paginacaoEsquema()
});

export const consultaHistoricoPaciente = z.object({ ...paginacaoEsquema() });
