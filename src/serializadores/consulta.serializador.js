import { dataParaISO } from '../utilitarios/datas.js';
import {
  classificarFrequenciaCardiaca,
  classificarGlicemia,
  classificarImc
} from '../utilitarios/indicadores.js';
import { serializarPacienteResumo } from './paciente.serializador.js';
import { serializarProfissionalResumo } from './profissional.serializador.js';

/** Dados clínicos já decifrados + as classificações derivadas (IMC, bpm, glicemia). */
export function serializarDadosClinicos(dados) {
  return {
    peso: dados.peso ?? null,
    altura: dados.altura ?? null,
    imc: dados.imc ?? null,
    imcClassificacao: classificarImc(dados.imc),
    pressaoArterial: dados.pressaoArterial ?? null,
    frequenciaCardiaca: dados.frequenciaCardiaca ?? null,
    frequenciaCardiacaClassificacao: classificarFrequenciaCardiaca(dados.frequenciaCardiaca),
    glicemia: dados.glicemia ?? null,
    glicemiaClassificacao: classificarGlicemia(dados.glicemia),
    habitosSono: dados.habitosSono ?? null,
    atividadeFisica: dados.atividadeFisica ?? null,
    alimentacao: dados.alimentacao ?? null,
    observacoes: dados.observacoes ?? null
  };
}

function base(consulta) {
  return {
    id: consulta.id,
    data: dataParaISO(consulta.data),
    hora: consulta.hora,
    status: consulta.status,
    criadoEm: consulta.criadoEm.toISOString()
  };
}

/** Visão do profissional: quem é o paciente do horário. `dados` (opcional) = dados clínicos decifrados. */
export function serializarConsultaParaProfissional(consulta, dados) {
  return {
    ...base(consulta),
    paciente: serializarPacienteResumo(consulta.paciente),
    ...(dados ? { dadosClinicos: serializarDadosClinicos(dados) } : {})
  };
}

/** Visão do paciente: com quem é a consulta. `dados` (opcional) = dados clínicos decifrados. */
export function serializarConsultaParaPaciente(consulta, dados) {
  return {
    ...base(consulta),
    profissional: serializarProfissionalResumo(consulta.profissional),
    ...(dados ? { dadosClinicos: serializarDadosClinicos(dados) } : {})
  };
}

/** Horário livre exibido ao paciente (sem dados de ninguém). */
export function serializarHorarioDisponivel(consulta) {
  return { id: consulta.id, data: dataParaISO(consulta.data), hora: consulta.hora };
}
