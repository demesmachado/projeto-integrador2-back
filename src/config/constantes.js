/** Constantes de domínio e limites de segurança usados por toda a aplicação. */

export const PREFIXO_API = '/api/v1';

// Mesmo vocabulário do front-end (sessao.papel).
export const PAPEIS = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  PROFISSIONAL: 'profissional',
  PACIENTE: 'paciente'
});

export const TIPOS_ORGANIZACAO = Object.freeze(['Hospital', 'Plano de Saúde', 'Organização de Saúde']);

export const ESPECIALIDADES = Object.freeze(['Médico(a)', 'Enfermeiro(a)', 'Técnico(a) em Enfermagem']);

export const SEXOS = Object.freeze(['Feminino', 'Masculino', 'Outro']);

export const STATUS_CONSULTA = Object.freeze({
  DISPONIVEL: 'disponivel',
  SOLICITADA: 'solicitada',
  CONFIRMADA: 'confirmada',
  RECUSADA: 'recusada',
  REALIZADA: 'realizada',
  CANCELADA: 'cancelada'
});

/** Status em que o profissional pode excluir o horário (nada clínico nem em andamento). */
export const STATUS_EXCLUIVEIS = Object.freeze([
  STATUS_CONSULTA.DISPONIVEL,
  STATUS_CONSULTA.RECUSADA,
  STATUS_CONSULTA.CANCELADA
]);

export const TIPOS_NOTIFICACAO = Object.freeze({
  MEDICAMENTO: 'medicamento',
  CONSULTA: 'consulta',
  BEM_ESTAR: 'bemEstar'
});

export const TIPOS_CONTEUDO = Object.freeze(['documentario', 'curso', 'livro', 'artigo']);

export const INDICADORES_BEM_ESTAR = Object.freeze(['Ótimo', 'Bom', 'Regular', 'Ruim']);

export const HABITOS_SONO = Object.freeze(['Regular (7-9h)', 'Insuficiente (<6h)', 'Irregular', 'Com insônia']);

export const ATIVIDADES_FISICAS = Object.freeze([
  'Sedentário',
  'Leve (1-2x/semana)',
  'Moderada (3-4x/semana)',
  'Intensa (5+/semana)'
]);

/** Fuso usado para decidir "hoje" (o servidor roda em UTC; sem isto, à noite o dia viraria 3h antes). */
export const FUSO_HORARIO = 'America/Sao_Paulo';

export const LIMITES = Object.freeze({
  senhaMinima: 8,
  senhaMaximaBytes: 72, // limite do bcrypt: acima disso o hash ignoraria o restante da senha
  digitosSenhaTemporaria: 6,

  // Teto de solicitações em aberto por paciente (evita um paciente "reservar" a agenda inteira).
  maxConsultasEmAbertoPorPaciente: 5,
  // Quantas consultas realizadas entram na média dos indicadores do painel do paciente.
  maxConsultasNaMedia: 100,

  paginaPadrao: 20,
  paginaMaxima: 100,

  corpoPadrao: '32kb'
});
