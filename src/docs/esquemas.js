import {
  ATIVIDADES_FISICAS,
  ESPECIALIDADES,
  HABITOS_SONO,
  INDICADORES_BEM_ESTAR,
  LIMITES,
  PAPEIS,
  SEXOS,
  STATUS_CONSULTA,
  TIPOS_CONTEUDO,
  TIPOS_NOTIFICACAO,
  TIPOS_ORGANIZACAO
} from '../config/constantes.js';

/** Esquemas (components.schemas) da especificação OpenAPI. */

export const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` });

const uuid = (exemplo = '3f2b8c1e-5a47-4d0e-9d38-6a1f0c9e7b21') => ({ type: 'string', format: 'uuid', example: exemplo });
const dataHora = { type: 'string', format: 'date-time', example: '2026-10-08T14:30:00.000Z' };
const dataIso = (exemplo = '2026-10-15') => ({ type: 'string', format: 'date', example: exemplo });
const enumeracao = (valores, exemplo) => ({ type: 'string', enum: [...valores], example: exemplo ?? valores[0] });

/** Envelope de listagem paginada. */
export const paginado = (esquemaItem, extras = {}) => ({
  type: 'object',
  properties: {
    itens: { type: 'array', items: esquemaItem },
    total: { type: 'integer', example: 42 },
    pagina: { type: 'integer', example: 1 },
    limite: { type: 'integer', example: LIMITES.paginaPadrao },
    totalPaginas: { type: 'integer', example: 3 },
    ...extras
  }
});

const campoSenhaGerada = {
  type: 'string',
  example: '482913',
  description: 'Senha temporária de 6 dígitos. Exibida UMA única vez: não fica guardada em texto no servidor.'
};

const resumoProfissional = {
  type: 'object',
  nullable: true,
  properties: {
    id: uuid(),
    nome: { type: 'string', example: 'Dr. Carlos Lima' },
    especialidade: enumeracao(ESPECIALIDADES)
  }
};

const resumoOrganizacao = {
  type: 'object',
  nullable: true,
  properties: { id: uuid(), nome: { type: 'string' }, tipo: enumeracao(TIPOS_ORGANIZACAO) }
};

export const esquemas = {
  Erro: {
    type: 'object',
    properties: {
      erro: {
        type: 'object',
        properties: {
          codigo: { type: 'string', example: 'REQUISICAO_INVALIDA' },
          mensagem: { type: 'string', example: 'Dados inválidos.' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { campo: { type: 'string', example: 'corpo.email' }, mensagem: { type: 'string' } }
            }
          },
          idRequisicao: uuid()
        }
      }
    }
  },

  // ---- Autenticação ----
  EntrarEntrada: {
    type: 'object',
    required: ['papel', 'email', 'senha'],
    properties: {
      papel: enumeracao(Object.values(PAPEIS), 'paciente'),
      email: { type: 'string', format: 'email', example: 'joana@email.com' },
      senha: { type: 'string', example: '482913' }
    }
  },
  Sessao: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'JWT. Envie em `Authorization: Bearer <token>`.' },
      tipo: { type: 'string', example: 'Bearer' },
      expiraEm: dataHora,
      usuario: { type: 'object', description: 'Dados do usuário logado (variam conforme o perfil).' }
    }
  },
  AlterarSenhaEntrada: {
    type: 'object',
    required: ['senhaAtual', 'novaSenha'],
    properties: {
      senhaAtual: { type: 'string' },
      novaSenha: {
        type: 'string',
        minLength: LIMITES.senhaMinima,
        description: `Mínimo ${LIMITES.senhaMinima} caracteres e no máximo ${LIMITES.senhaMaximaBytes} bytes.`
      }
    }
  },
  SenhaGerada: {
    type: 'object',
    properties: { senhaGerada: campoSenhaGerada }
  },

  // ---- Organizações e administradores ----
  OrganizacaoEntrada: {
    type: 'object',
    required: ['nome', 'tipo'],
    properties: { nome: { type: 'string', example: 'Hospital São Lucas' }, tipo: enumeracao(TIPOS_ORGANIZACAO) }
  },
  Organizacao: {
    type: 'object',
    properties: {
      id: uuid(),
      nome: { type: 'string', example: 'Hospital São Lucas' },
      tipo: enumeracao(TIPOS_ORGANIZACAO),
      totais: {
        type: 'object',
        properties: {
          administradores: { type: 'integer' },
          profissionais: { type: 'integer' },
          pacientes: { type: 'integer' }
        }
      },
      criadoEm: dataHora
    }
  },
  AdministradorEntrada: {
    type: 'object',
    required: ['nome', 'email', 'senha'],
    properties: {
      nome: { type: 'string', example: 'Maria Souza' },
      email: { type: 'string', format: 'email', example: 'maria.admin@hospitalsl.com' },
      senha: { type: 'string', minLength: LIMITES.senhaMinima, description: 'Definida pelo Super Admin.' }
    }
  },
  AdministradorAtualizacao: {
    type: 'object',
    required: ['nome', 'email'],
    properties: {
      nome: { type: 'string' },
      email: { type: 'string', format: 'email' },
      novaSenha: { type: 'string', minLength: LIMITES.senhaMinima, description: 'Opcional. Se enviada, troca a senha e encerra as sessões do administrador.' }
    }
  },
  Administrador: {
    type: 'object',
    properties: {
      id: uuid(),
      nome: { type: 'string' },
      email: { type: 'string', format: 'email' },
      organizacaoId: uuid(),
      criadoEm: dataHora
    }
  },

  // ---- Profissionais ----
  ProfissionalEntrada: {
    type: 'object',
    required: ['nome', 'especialidade', 'email'],
    properties: {
      nome: { type: 'string', example: 'Dr. Carlos Lima' },
      especialidade: enumeracao(ESPECIALIDADES),
      crm: { type: 'string', nullable: true, example: 'CRM 4521-PI', description: 'CRM/COREN/registro profissional (opcional).' },
      telefone: { type: 'string', nullable: true, example: '(89) 99999-1234' },
      email: { type: 'string', format: 'email', example: 'carlos.lima@hospitalsl.com' }
    }
  },
  ProfissionalAtualizacao: {
    allOf: [
      ref('ProfissionalEntrada'),
      {
        type: 'object',
        properties: {
          ativo: { type: 'boolean', description: '`false` bloqueia o acesso sem apagar o histórico clínico.' }
        }
      }
    ]
  },
  Profissional: {
    type: 'object',
    properties: {
      id: uuid(),
      nome: { type: 'string' },
      especialidade: enumeracao(ESPECIALIDADES),
      crm: { type: 'string', nullable: true },
      telefone: { type: 'string', nullable: true, example: '(89) 99999-1234' },
      email: { type: 'string', format: 'email' },
      organizacaoId: uuid(),
      ativo: { type: 'boolean' },
      senhaTemporaria: { type: 'boolean', description: 'true enquanto o profissional não trocar a senha gerada.' },
      totalPacientes: { type: 'integer', description: 'Presente nas listagens.' },
      criadoEm: dataHora
    }
  },
  ProfissionalCriado: {
    type: 'object',
    properties: { profissional: ref('Profissional'), senhaGerada: campoSenhaGerada }
  },

  // ---- Pacientes ----
  PacienteEntrada: {
    type: 'object',
    required: ['nome', 'sexo', 'dataNascimento', 'email'],
    properties: {
      nome: { type: 'string', example: 'Joana Pereira' },
      sexo: enumeracao(SEXOS),
      dataNascimento: dataIso('1990-03-05'),
      email: { type: 'string', format: 'email', example: 'joana.pereira@email.com' },
      profissionalId: {
        ...uuid(),
        nullable: true,
        description:
          'Profissional responsável. O administrador informa (omitido = sem vínculo; no PUT, omitido = mantém, null = remove). Quando o profissional cadastra, ele próprio é o responsável.'
      }
    }
  },
  Paciente: {
    type: 'object',
    properties: {
      id: uuid(),
      nome: { type: 'string' },
      sexo: enumeracao(SEXOS),
      dataNascimento: dataIso('1990-03-05'),
      idade: { type: 'integer', example: 36 },
      email: { type: 'string', format: 'email' },
      organizacaoId: uuid(),
      profissional: resumoProfissional,
      senhaTemporaria: { type: 'boolean' },
      criadoEm: dataHora
    }
  },
  PacienteCriado: {
    type: 'object',
    properties: { paciente: ref('Paciente'), senhaGerada: campoSenhaGerada }
  },

  // ---- Agenda e consultas ----
  HorarioEntrada: {
    type: 'object',
    required: ['data', 'hora'],
    properties: { data: dataIso(), hora: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '14:30' } }
  },
  DadosClinicosEntrada: {
    type: 'object',
    description: 'TODOS os campos são opcionais. O IMC é calculado pelo servidor (peso ÷ altura²) e não é aceito na entrada.',
    properties: {
      peso: { type: 'number', nullable: true, minimum: 1, maximum: 500, example: 68.5, description: 'kg' },
      altura: { type: 'number', nullable: true, minimum: 0.3, maximum: 2.8, example: 1.7, description: 'metros' },
      pressaoArterial: { type: 'string', nullable: true, example: '120/80', description: 'mmHg, formato sistólica/diastólica' },
      frequenciaCardiaca: { type: 'integer', nullable: true, minimum: 20, maximum: 300, example: 72, description: 'bpm' },
      glicemia: { type: 'number', nullable: true, minimum: 10, maximum: 1500, example: 95, description: 'mg/dL' },
      habitosSono: { ...enumeracao(HABITOS_SONO), nullable: true },
      atividadeFisica: { ...enumeracao(ATIVIDADES_FISICAS), nullable: true },
      alimentacao: { type: 'string', nullable: true, maxLength: 2000 },
      observacoes: { type: 'string', nullable: true, maxLength: 2000 }
    }
  },
  DadosClinicos: {
    type: 'object',
    properties: {
      peso: { type: 'number', nullable: true, example: 68.5 },
      altura: { type: 'number', nullable: true, example: 1.7 },
      imc: { type: 'number', nullable: true, example: 23.7 },
      imcClassificacao: { type: 'string', nullable: true, example: 'Peso normal' },
      pressaoArterial: { type: 'string', nullable: true, example: '120/80' },
      frequenciaCardiaca: { type: 'integer', nullable: true, example: 72 },
      frequenciaCardiacaClassificacao: { ...enumeracao(INDICADORES_BEM_ESTAR, 'Ótimo'), nullable: true },
      glicemia: { type: 'number', nullable: true, example: 95 },
      glicemiaClassificacao: { ...enumeracao(INDICADORES_BEM_ESTAR, 'Ótimo'), nullable: true },
      habitosSono: { type: 'string', nullable: true },
      atividadeFisica: { type: 'string', nullable: true },
      alimentacao: { type: 'string', nullable: true },
      observacoes: { type: 'string', nullable: true }
    }
  },
  Horario: {
    type: 'object',
    description: 'Visão do profissional. `dadosClinicos` só aparece no detalhe de consultas realizadas.',
    properties: {
      id: uuid(),
      data: dataIso(),
      hora: { type: 'string', example: '14:30' },
      status: enumeracao(Object.values(STATUS_CONSULTA)),
      paciente: {
        type: 'object',
        nullable: true,
        properties: { id: uuid(), nome: { type: 'string', example: 'Joana Pereira' } }
      },
      dadosClinicos: ref('DadosClinicos'),
      criadoEm: dataHora
    }
  },
  ConsultaDoPaciente: {
    type: 'object',
    description: 'Visão do paciente. `dadosClinicos` só aparece no histórico (consultas realizadas).',
    properties: {
      id: uuid(),
      data: dataIso(),
      hora: { type: 'string', example: '14:30' },
      status: enumeracao(Object.values(STATUS_CONSULTA)),
      profissional: resumoProfissional,
      dadosClinicos: ref('DadosClinicos'),
      criadoEm: dataHora
    }
  },
  HorarioDisponivel: {
    type: 'object',
    properties: { id: uuid(), data: dataIso(), hora: { type: 'string', example: '14:30' } }
  },

  // ---- Evolução ----
  EvolucaoEntrada: {
    type: 'object',
    required: ['indicadorBemEstar', 'texto'],
    properties: {
      indicadorBemEstar: enumeracao(INDICADORES_BEM_ESTAR),
      texto: { type: 'string', maxLength: 2000, example: 'Boa evolução; segue dieta e exercícios recomendados.' }
    }
  },
  Evolucao: {
    type: 'object',
    properties: {
      id: uuid(),
      pacienteId: uuid(),
      indicadorBemEstar: enumeracao(INDICADORES_BEM_ESTAR),
      texto: { type: 'string' },
      profissional: resumoProfissional,
      criadoEm: dataHora
    }
  },

  // ---- Notificações ----
  NotificacaoEntrada: {
    type: 'object',
    required: ['pacienteId', 'tipo', 'titulo', 'mensagem'],
    properties: {
      pacienteId: uuid(),
      tipo: enumeracao(Object.values(TIPOS_NOTIFICACAO), 'medicamento'),
      titulo: { type: 'string', maxLength: 150, example: 'Hora de tomar seu medicamento' },
      mensagem: { type: 'string', maxLength: 2000, example: 'Tome 1 comprimido de Losartana 50mg após o almoço.' }
    }
  },
  NotificacaoAtualizacao: {
    type: 'object',
    required: ['tipo', 'titulo', 'mensagem'],
    properties: {
      tipo: enumeracao(Object.values(TIPOS_NOTIFICACAO), 'medicamento'),
      titulo: { type: 'string', maxLength: 150 },
      mensagem: { type: 'string', maxLength: 2000 }
    }
  },
  Notificacao: {
    type: 'object',
    properties: {
      id: uuid(),
      tipo: enumeracao(Object.values(TIPOS_NOTIFICACAO), 'medicamento'),
      titulo: { type: 'string' },
      mensagem: { type: 'string' },
      lida: { type: 'boolean' },
      paciente: {
        type: 'object',
        description: 'Presente só na visão do profissional.',
        properties: { id: uuid(), nome: { type: 'string' } }
      },
      criadoEm: dataHora
    }
  },

  // ---- Conteúdos ----
  ConteudoEntrada: {
    type: 'object',
    required: ['titulo', 'tipo', 'descricao'],
    properties: {
      titulo: { type: 'string', example: 'Evite o estresse!' },
      tipo: enumeracao(TIPOS_CONTEUDO),
      descricao: { type: 'string', maxLength: 1000 },
      url: { type: 'string', nullable: true, example: 'https://exemplo.com/conteudo', description: 'Somente http(s).' }
    }
  },
  Conteudo: {
    type: 'object',
    properties: {
      id: uuid(),
      titulo: { type: 'string' },
      tipo: enumeracao(TIPOS_CONTEUDO),
      descricao: { type: 'string' },
      url: { type: 'string', nullable: true },
      global: { type: 'boolean', description: 'true = conteúdo do sistema (imutável).' },
      editavel: { type: 'boolean', description: 'true se quem pediu é o autor.' },
      criadoEm: dataHora
    }
  },
  RecomendacaoEntrada: {
    type: 'object',
    required: ['conteudoId'],
    properties: { conteudoId: uuid() }
  },
  Recomendacao: {
    type: 'object',
    properties: {
      id: uuid(),
      pacienteId: uuid(),
      conteudo: ref('Conteudo'),
      recomendadoPor: { type: 'object', nullable: true, properties: { id: uuid(), nome: { type: 'string' } } },
      criadoEm: dataHora
    }
  },

  // ---- Painéis ----
  PainelSuperAdmin: {
    type: 'object',
    properties: {
      papel: enumeracao([PAPEIS.SUPERADMIN]),
      totais: {
        type: 'object',
        properties: {
          organizacoes: { type: 'integer' },
          administradores: { type: 'integer' },
          profissionais: { type: 'integer' },
          pacientes: { type: 'integer' }
        }
      },
      organizacoes: { type: 'array', items: ref('Organizacao') }
    }
  },
  PainelAdmin: {
    type: 'object',
    properties: {
      papel: enumeracao([PAPEIS.ADMIN]),
      organizacao: resumoOrganizacao,
      totais: {
        type: 'object',
        properties: {
          profissionais: { type: 'integer' },
          pacientes: { type: 'integer' },
          consultasRealizadas: { type: 'integer' }
        }
      },
      profissionaisRecentes: { type: 'array', items: ref('Profissional') }
    }
  },
  PainelProfissional: {
    type: 'object',
    properties: {
      papel: enumeracao([PAPEIS.PROFISSIONAL]),
      totais: {
        type: 'object',
        properties: {
          pacientes: { type: 'integer' },
          consultasConfirmadasHoje: { type: 'integer' },
          solicitacoesPendentes: { type: 'integer' }
        }
      },
      proximasConsultas: { type: 'array', items: ref('Horario') }
    }
  },
  Indicador: {
    type: 'object',
    properties: {
      media: { type: 'number', nullable: true, example: 72 },
      classificacao: { ...enumeracao(INDICADORES_BEM_ESTAR, 'Ótimo'), nullable: true },
      unidade: { type: 'string', example: 'bpm' },
      amostras: { type: 'integer', example: 3 }
    }
  },
  PainelPaciente: {
    type: 'object',
    properties: {
      papel: enumeracao([PAPEIS.PACIENTE]),
      profissional: resumoProfissional,
      indicadores: {
        type: 'object',
        properties: { frequenciaCardiaca: ref('Indicador'), glicemia: ref('Indicador') }
      },
      proximasConsultas: { type: 'array', items: ref('ConsultaDoPaciente') },
      notificacoesRecentes: { type: 'array', items: ref('Notificacao') },
      notificacoesNaoLidas: { type: 'integer' }
    }
  }
};
