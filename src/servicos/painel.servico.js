import { LIMITES, PAPEIS } from '../config/constantes.js';
import * as consultaRepositorio from '../repositorios/consulta.repositorio.js';
import * as notificacaoRepositorio from '../repositorios/notificacao.repositorio.js';
import * as organizacaoRepositorio from '../repositorios/organizacao.repositorio.js';
import * as pacienteRepositorio from '../repositorios/paciente.repositorio.js';
import * as profissionalRepositorio from '../repositorios/profissional.repositorio.js';
import {
  serializarConsultaParaPaciente,
  serializarConsultaParaProfissional
} from '../serializadores/consulta.serializador.js';
import { serializarNotificacao } from '../serializadores/notificacao.serializador.js';
import { serializarOrganizacao } from '../serializadores/organizacao.serializador.js';
import { serializarProfissional, serializarProfissionalResumo } from '../serializadores/profissional.serializador.js';
import { decifrarJson } from '../utilitarios/cifra.js';
import { contextoCifra } from '../utilitarios/contextoCifra.js';
import { hojeISO, isoParaData } from '../utilitarios/datas.js';
import { ErroApp } from '../utilitarios/erros.js';
import { classificarFrequenciaCardiaca, classificarGlicemia, media } from '../utilitarios/indicadores.js';

/** Dados do painel inicial de cada perfil (os mesmos 4 painéis do front-end). */

const MAXIMO_ORGANIZACOES_NO_PAINEL = 100;

async function painelDoSuperAdmin() {
  const [totais, organizacoes] = await Promise.all([
    organizacaoRepositorio.contarTotais(),
    organizacaoRepositorio.listar({ pular: 0, tomar: MAXIMO_ORGANIZACOES_NO_PAINEL })
  ]);
  return { papel: PAPEIS.SUPERADMIN, totais, organizacoes: organizacoes.map(serializarOrganizacao) };
}

async function painelDoAdmin(admin) {
  const filtro = { organizacaoId: admin.organizacaoId };
  const [organizacao, profissionais, pacientes, consultasRealizadas, recentes] = await Promise.all([
    organizacaoRepositorio.buscarPorId(admin.organizacaoId),
    profissionalRepositorio.contar(filtro),
    pacienteRepositorio.contar(filtro),
    consultaRepositorio.contarRealizadasDaOrganizacao(admin.organizacaoId),
    profissionalRepositorio.listarRecentes(admin.organizacaoId, 5)
  ]);

  return {
    papel: PAPEIS.ADMIN,
    organizacao: organizacao && { id: organizacao.id, nome: organizacao.nome, tipo: organizacao.tipo },
    totais: { profissionais, pacientes, consultasRealizadas },
    profissionaisRecentes: recentes.map(serializarProfissional)
  };
}

async function painelDoProfissional(profissional) {
  const hoje = isoParaData(hojeISO());
  const [totalPacientes, confirmadasHoje, solicitacoesPendentes, proximas] = await Promise.all([
    pacienteRepositorio.contarPorProfissional(profissional.id),
    consultaRepositorio.contarConfirmadasNoDia({ profissionalId: profissional.id, dia: hoje }),
    consultaRepositorio.contarPendentes(profissional.id),
    consultaRepositorio.listarProximasDoProfissional({ profissionalId: profissional.id, hoje, tomar: 6 })
  ]);

  return {
    papel: PAPEIS.PROFISSIONAL,
    totais: { pacientes: totalPacientes, consultasConfirmadasHoje: confirmadasHoje, solicitacoesPendentes },
    proximasConsultas: proximas.map((item) => serializarConsultaParaProfissional(item))
  };
}

/** Média + classificação de um indicador. Sem nenhuma medição registrada: tudo nulo. */
function resumirIndicador(valores, unidade, classificar) {
  const mediaCalculada = media(valores);
  return {
    media: mediaCalculada,
    classificacao: classificar(mediaCalculada),
    unidade,
    amostras: valores.length
  };
}

async function painelDoPaciente(paciente) {
  const hoje = isoParaData(hojeISO());
  const [realizadas, proximas, recentes, naoLidas, profissional] = await Promise.all([
    consultaRepositorio.listarRealizadasDoPaciente({ pacienteId: paciente.id, tomar: LIMITES.maxConsultasNaMedia }),
    consultaRepositorio.listarProximasDoPaciente({ pacienteId: paciente.id, hoje, tomar: 5 }),
    notificacaoRepositorio.listarDoPaciente({ pacienteId: paciente.id, pular: 0, tomar: 4 }),
    notificacaoRepositorio.contarDoPaciente({ pacienteId: paciente.id, apenasNaoLidas: true }),
    paciente.profissionalId ? profissionalRepositorio.buscarPorId(paciente.profissionalId) : null
  ]);

  const dadosClinicos = realizadas.map((consulta) =>
    decifrarJson(consulta.dadosClinicosCifrados, contextoCifra.consulta(consulta.id))
  );
  const numeros = (campo) => dadosClinicos.map((dados) => dados[campo]).filter((valor) => typeof valor === 'number');

  return {
    papel: PAPEIS.PACIENTE,
    profissional: serializarProfissionalResumo(profissional),
    indicadores: {
      frequenciaCardiaca: resumirIndicador(numeros('frequenciaCardiaca'), 'bpm', classificarFrequenciaCardiaca),
      glicemia: resumirIndicador(numeros('glicemia'), 'mg/dL', classificarGlicemia)
    },
    proximasConsultas: proximas.map((item) => serializarConsultaParaPaciente(item)),
    notificacoesRecentes: recentes.map((item) =>
      serializarNotificacao(item, decifrarJson(item.conteudoCifrado, contextoCifra.notificacao(item.id)))
    ),
    notificacoesNaoLidas: naoLidas
  };
}

export async function obterPainel(usuario) {
  switch (usuario.papel) {
    case PAPEIS.SUPERADMIN:
      return painelDoSuperAdmin();
    case PAPEIS.ADMIN:
      return painelDoAdmin(usuario);
    case PAPEIS.PROFISSIONAL:
      return painelDoProfissional(usuario);
    case PAPEIS.PACIENTE:
      return painelDoPaciente(usuario);
    default:
      throw new ErroApp(403, 'PROIBIDO', 'Perfil sem painel.');
  }
}
