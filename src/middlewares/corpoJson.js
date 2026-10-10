import express from 'express';
import { LIMITES } from '../config/constantes.js';

/**
 * Parser JSON com limite por rota. Não há parser global de propósito: o limite é pequeno (32 KB) e a leitura
 * do corpo acontece DEPOIS de autenticar e limitar a taxa. Só `application/json` é lido; qualquer outro tipo
 * deixa `req.body` indefinido e é recusado pelo validador.
 */
export const corpoJson = (limite = LIMITES.corpoPadrao) =>
  express.json({ limit: limite, type: 'application/json', strict: true });
