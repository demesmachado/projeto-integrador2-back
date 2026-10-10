import {
  PAPEIS,
  STATUS_CONSULTA,
  TIPOS_CONTEUDO,
  TIPOS_NOTIFICACAO,
  TIPOS_ORGANIZACAO
} from '../config/constantes.js';
import { paginado, ref } from './esquemas.js';

/** Caminhos (paths) da especificação OpenAPI, montados a partir de pequenos construtores. */

const autenticado = [{ bearerAuth: [] }];

const erro = (codigo) => ({ $ref: `#/components/responses/Erro${codigo}` });

const json = (esquema) => ({ content: { 'application/json': { schema: esquema } } });

const corpoJson = (esquema) => ({ required: true, content: { 'application/json': { schema: esquema } } });

const parametroCaminho = (nome = 'id', descricao = 'Identificador (UUID)') => ({
  name: nome,
  in: 'path',
  required: true,
  description: descricao,
  schema: { type: 'string', format: 'uuid' }
});

const parametroConsulta = (nome, esquema, descricao) => ({
  name: nome,
  in: 'query',
  ...(descricao ? { description: descricao } : {}),
  schema: esquema
});

const paginacao = [
  parametroConsulta('pagina', { type: 'integer', minimum: 1, default: 1 }),
  parametroConsulta('limite', { type: 'integer', minimum: 1, maximum: 100, default: 20 })
];

const busca = parametroConsulta('busca', { type: 'string', maxLength: 80 }, 'Texto para filtrar por nome.');

const DESCRICAO_PAPEIS = {
  [PAPEIS.SUPERADMIN]: 'Super Admin',
  [PAPEIS.ADMIN]: 'Administrador',
  [PAPEIS.PROFISSIONAL]: 'Profissional',
  [PAPEIS.PACIENTE]: 'Paciente'
};

/**
 * Monta uma operação. Os erros mais comuns são deduzidos: 401/403 se exige perfil, 400 se recebe dados,
 * 404 se tem parâmetro de caminho, 429 sempre.
 */
function operacao({ tag, resumo, descricao, papeis, parametros = [], corpo, ok = 200, resposta, extras = [] }) {
  const temCaminho = parametros.some((p) => p.in === 'path');
  const codigos = new Set(extras);
  if (papeis) {
    codigos.add(401);
    codigos.add(403);
  }
  if (corpo || parametros.some((p) => p.in === 'query')) codigos.add(400);
  if (temCaminho) codigos.add(400);
  if (temCaminho) codigos.add(404);
  codigos.add(429);

  const quemPode = papeis ? `**Perfis:** ${papeis.map((p) => DESCRICAO_PAPEIS[p]).join(', ')}.` : '';

  return {
    tags: [tag],
    summary: resumo,
    description: [quemPode, descricao].filter(Boolean).join('\n\n') || undefined,
    ...(papeis ? { security: autenticado } : {}),
    ...(parametros.length > 0 ? { parameters: parametros } : {}),
    ...(corpo ? { requestBody: corpoJson(corpo) } : {}),
    responses: {
      [ok]: { description: ok === 204 ? 'Sem conteúdo.' : 'Sucesso.', ...(resposta ? json(resposta) : {}) },
      ...Object.fromEntries([...codigos].sort().map((c) => [String(c), erro(c)]))
    }
  };
}

const PAPEL_ADMIN = [PAPEIS.ADMIN];
const PAPEL_PROFISSIONAL = [PAPEIS.PROFISSIONAL];
const PAPEL_PACIENTE = [PAPEIS.PACIENTE];
const PAPEL_SUPER = [PAPEIS.SUPERADMIN];
const TODOS = Object.values(PAPEIS);

export const caminhos = {
  '/saude': {
    get: {
      tags: ['Sistema'],
      summary: 'Verificação de saúde (banco acessível)',
      responses: { 200: { description: 'OK.' }, 503: erro(503) }
    }
  },

  // ---------------------------------------------------------------- Autenticação
  '/autenticacao/entrar': {
    post: operacao({
      tag: 'Autenticação',
      resumo: 'Entrar (login)',
      descricao:
        'Informe o `papel`, o e-mail e a senha. O Super Admin usa as credenciais do `.env`; profissionais e pacientes usam a senha de 6 dígitos gerada no cadastro (troque-a em `PUT /autenticacao/senha`). Limite de tentativas por IP e por conta.',
      corpo: ref('EntrarEntrada'),
      resposta: ref('Sessao'),
      extras: [401]
    })
  },
  '/autenticacao/sair': {
    post: operacao({
      tag: 'Autenticação',
      resumo: 'Sair em todos os dispositivos',
      descricao: 'Invalida todos os tokens já emitidos para a conta.',
      papeis: TODOS,
      ok: 204
    })
  },
  '/autenticacao/eu': {
    get: operacao({ tag: 'Autenticação', resumo: 'Dados do usuário logado', papeis: TODOS })
  },
  '/autenticacao/senha': {
    put: operacao({
      tag: 'Autenticação',
      resumo: 'Trocar a própria senha',
      descricao:
        'Exige a senha atual. Encerra as outras sessões e devolve uma sessão nova. Não se aplica ao Super Admin (a senha dele fica no `.env`).',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL, PAPEIS.PACIENTE],
      corpo: ref('AlterarSenhaEntrada'),
      resposta: ref('Sessao'),
      extras: [422]
    })
  },

  // ---------------------------------------------------------------- Painel
  '/painel': {
    get: operacao({
      tag: 'Painel',
      resumo: 'Painel inicial do perfil logado',
      descricao:
        'O formato muda conforme o perfil: `PainelSuperAdmin`, `PainelAdmin`, `PainelProfissional` ou `PainelPaciente` (médias de bpm e glicemia com classificação Ruim/Regular/Bom/Ótimo).',
      papeis: TODOS,
      resposta: {
        oneOf: [ref('PainelSuperAdmin'), ref('PainelAdmin'), ref('PainelProfissional'), ref('PainelPaciente')]
      }
    })
  },

  // ---------------------------------------------------------------- Organizações (Super Admin)
  '/organizacoes': {
    get: operacao({
      tag: 'Organizações',
      resumo: 'Listar organizações',
      papeis: PAPEL_SUPER,
      parametros: [
        busca,
        parametroConsulta('tipo', { type: 'string', enum: [...TIPOS_ORGANIZACAO] }),
        ...paginacao
      ],
      resposta: paginado(ref('Organizacao'))
    }),
    post: operacao({
      tag: 'Organizações',
      resumo: 'Cadastrar organização (hospital, plano ou organização de saúde)',
      papeis: PAPEL_SUPER,
      corpo: ref('OrganizacaoEntrada'),
      ok: 201,
      resposta: ref('Organizacao'),
      extras: [409]
    })
  },
  '/organizacoes/{id}': {
    get: operacao({
      tag: 'Organizações',
      resumo: 'Detalhar organização',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      resposta: ref('Organizacao')
    }),
    put: operacao({
      tag: 'Organizações',
      resumo: 'Atualizar organização',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      corpo: ref('OrganizacaoEntrada'),
      resposta: ref('Organizacao'),
      extras: [409]
    }),
    delete: operacao({
      tag: 'Organizações',
      resumo: 'Excluir organização (em cascata)',
      descricao:
        '**Apaga também** administradores, profissionais, pacientes e todo o histórico clínico. Exige `?confirmar=true`.',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho(), parametroConsulta('confirmar', { type: 'string', enum: ['true'] }, 'Obrigatório.')],
      ok: 204
    })
  },
  '/organizacoes/{id}/administradores': {
    get: operacao({
      tag: 'Organizações',
      resumo: 'Listar administradores da organização',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      resposta: { type: 'object', properties: { itens: { type: 'array', items: ref('Administrador') } } }
    }),
    post: operacao({
      tag: 'Organizações',
      resumo: 'Cadastrar administrador (o Super Admin define a senha)',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      corpo: ref('AdministradorEntrada'),
      ok: 201,
      resposta: ref('Administrador'),
      extras: [409]
    })
  },
  '/administradores/{id}': {
    put: operacao({
      tag: 'Organizações',
      resumo: 'Atualizar administrador',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      corpo: ref('AdministradorAtualizacao'),
      resposta: ref('Administrador'),
      extras: [409]
    }),
    delete: operacao({
      tag: 'Organizações',
      resumo: 'Excluir administrador',
      papeis: PAPEL_SUPER,
      parametros: [parametroCaminho()],
      ok: 204
    })
  },

  // ---------------------------------------------------------------- Profissionais (Administrador)
  '/profissionais': {
    get: operacao({
      tag: 'Profissionais',
      resumo: 'Listar profissionais da organização',
      papeis: PAPEL_ADMIN,
      parametros: [parametroConsulta('busca', { type: 'string' }, 'Nome ou especialidade.'), ...paginacao],
      resposta: paginado(ref('Profissional'))
    }),
    post: operacao({
      tag: 'Profissionais',
      resumo: 'Cadastrar profissional (gera senha de 6 dígitos)',
      descricao: 'A resposta traz `senhaGerada` **uma única vez**. Repasse ao profissional; ele deve trocá-la no primeiro acesso.',
      papeis: PAPEL_ADMIN,
      corpo: ref('ProfissionalEntrada'),
      ok: 201,
      resposta: ref('ProfissionalCriado'),
      extras: [409]
    })
  },
  '/profissionais/{id}': {
    get: operacao({
      tag: 'Profissionais',
      resumo: 'Detalhar profissional',
      papeis: PAPEL_ADMIN,
      parametros: [parametroCaminho()],
      resposta: ref('Profissional')
    }),
    put: operacao({
      tag: 'Profissionais',
      resumo: 'Atualizar profissional (inclui ativar/desativar)',
      papeis: PAPEL_ADMIN,
      parametros: [parametroCaminho()],
      corpo: ref('ProfissionalAtualizacao'),
      resposta: ref('Profissional'),
      extras: [409]
    }),
    delete: operacao({
      tag: 'Profissionais',
      resumo: 'Excluir profissional',
      descricao:
        'Só é possível se o profissional não tiver atendimentos ou evoluções registrados (senão responde 409: desative a conta). Os pacientes dele ficam sem responsável.',
      papeis: PAPEL_ADMIN,
      parametros: [parametroCaminho()],
      ok: 204,
      extras: [409]
    })
  },
  '/profissionais/{id}/redefinir-senha': {
    post: operacao({
      tag: 'Profissionais',
      resumo: 'Gerar nova senha temporária',
      papeis: PAPEL_ADMIN,
      parametros: [parametroCaminho()],
      resposta: ref('SenhaGerada')
    })
  },

  // ---------------------------------------------------------------- Pacientes
  '/pacientes': {
    get: operacao({
      tag: 'Pacientes',
      resumo: 'Listar pacientes',
      descricao: 'Administrador: toda a organização (pode filtrar por `profissionalId`). Profissional: apenas os seus pacientes.',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL],
      parametros: [
        busca,
        parametroConsulta('profissionalId', { type: 'string', format: 'uuid' }, 'Filtro do administrador.'),
        ...paginacao
      ],
      resposta: paginado(ref('Paciente'))
    }),
    post: operacao({
      tag: 'Pacientes',
      resumo: 'Cadastrar paciente (gera senha de 6 dígitos)',
      descricao:
        'Sexo, data de nascimento e e-mail são gravados **criptografados**. O profissional que cadastra torna-se o responsável; o administrador pode indicar `profissionalId`. A resposta traz `senhaGerada` uma única vez.',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL],
      corpo: ref('PacienteEntrada'),
      ok: 201,
      resposta: ref('PacienteCriado'),
      extras: [409]
    })
  },
  '/pacientes/{id}': {
    get: operacao({
      tag: 'Pacientes',
      resumo: 'Detalhar paciente (dados decifrados)',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL],
      parametros: [parametroCaminho()],
      resposta: ref('Paciente')
    }),
    put: operacao({
      tag: 'Pacientes',
      resumo: 'Atualizar paciente',
      descricao: 'Somente o administrador altera o profissional responsável.',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL],
      parametros: [parametroCaminho()],
      corpo: ref('PacienteEntrada'),
      resposta: ref('Paciente'),
      extras: [409]
    }),
    delete: operacao({
      tag: 'Pacientes',
      resumo: 'Excluir paciente e todo o seu histórico',
      papeis: PAPEL_ADMIN,
      parametros: [parametroCaminho()],
      ok: 204
    })
  },
  '/pacientes/{id}/redefinir-senha': {
    post: operacao({
      tag: 'Pacientes',
      resumo: 'Gerar nova senha temporária',
      papeis: [PAPEIS.ADMIN, PAPEIS.PROFISSIONAL],
      parametros: [parametroCaminho()],
      resposta: ref('SenhaGerada')
    })
  },
  '/pacientes/{id}/historico': {
    get: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Histórico de consultas realizadas (dados clínicos decifrados)',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho(), ...paginacao],
      resposta: paginado(ref('ConsultaDoPaciente'))
    })
  },
  '/pacientes/{id}/evolucoes': {
    get: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Listar evoluções do paciente',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho(), ...paginacao],
      resposta: paginado(ref('Evolucao'))
    }),
    post: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Registrar evolução (imutável)',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      corpo: ref('EvolucaoEntrada'),
      ok: 201,
      resposta: ref('Evolucao')
    })
  },
  '/pacientes/{id}/recomendacoes': {
    get: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Conteúdos recomendados ao paciente',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho(), ...paginacao],
      resposta: paginado(ref('Recomendacao'))
    }),
    post: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Recomendar conteúdo ao paciente',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      corpo: ref('RecomendacaoEntrada'),
      ok: 201,
      resposta: ref('Recomendacao'),
      extras: [409]
    })
  },
  '/pacientes/{id}/recomendacoes/{recomendacaoId}': {
    delete: operacao({
      tag: 'Ficha do paciente',
      resumo: 'Remover recomendação',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho(), parametroCaminho('recomendacaoId', 'Identificador da recomendação')],
      ok: 204
    })
  },

  // ---------------------------------------------------------------- Agenda (Profissional)
  '/agenda': {
    get: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Listar horários da agenda',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [
        parametroConsulta('status', { type: 'string', enum: Object.values(STATUS_CONSULTA) }),
        parametroConsulta('busca', { type: 'string' }, 'Nome do paciente.'),
        parametroConsulta('de', { type: 'string', format: 'date' }),
        parametroConsulta('ate', { type: 'string', format: 'date' }),
        ...paginacao
      ],
      resposta: paginado(ref('Horario'))
    }),
    post: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Criar horário disponível',
      descricao: 'Não aceita datas passadas nem dois horários iguais.',
      papeis: PAPEL_PROFISSIONAL,
      corpo: ref('HorarioEntrada'),
      ok: 201,
      resposta: ref('Horario'),
      extras: [409, 422]
    })
  },
  '/agenda/{id}': {
    get: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Detalhar horário (com dados clínicos se realizada)',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      resposta: ref('Horario')
    }),
    delete: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Excluir horário',
      descricao: 'Só horários disponíveis, recusados ou cancelados.',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      ok: 204,
      extras: [409]
    })
  },
  '/agenda/{id}/confirmar': {
    post: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Confirmar solicitação',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      resposta: ref('Horario'),
      extras: [409]
    })
  },
  '/agenda/{id}/recusar': {
    post: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Recusar solicitação',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      resposta: ref('Horario'),
      extras: [409]
    })
  },
  '/agenda/{id}/cancelar': {
    post: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Cancelar consulta confirmada',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      resposta: ref('Horario'),
      extras: [409]
    })
  },
  '/agenda/{id}/registrar': {
    post: operacao({
      tag: 'Agenda (profissional)',
      resumo: 'Registrar a consulta realizada e seus dados clínicos',
      descricao: 'Só consultas confirmadas. Todos os campos clínicos são opcionais e ficam criptografados.',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      corpo: ref('DadosClinicosEntrada'),
      resposta: ref('Horario'),
      extras: [409]
    })
  },

  // ---------------------------------------------------------------- Consultas (Paciente)
  '/consultas/disponiveis': {
    get: operacao({
      tag: 'Consultas (paciente)',
      resumo: 'Horários livres do meu profissional',
      papeis: PAPEL_PACIENTE,
      parametros: paginacao,
      resposta: paginado(ref('HorarioDisponivel'), {
        profissional: { type: 'object', nullable: true, description: 'Profissional responsável (null se não houver).' }
      })
    })
  },
  '/consultas/minhas': {
    get: operacao({
      tag: 'Consultas (paciente)',
      resumo: 'Minhas consultas e solicitações',
      papeis: PAPEL_PACIENTE,
      parametros: [parametroConsulta('status', { type: 'string', enum: Object.values(STATUS_CONSULTA) }), ...paginacao],
      resposta: paginado(ref('ConsultaDoPaciente'))
    })
  },
  '/consultas/historico': {
    get: operacao({
      tag: 'Consultas (paciente)',
      resumo: 'Histórico de consultas realizadas (com dados clínicos)',
      papeis: PAPEL_PACIENTE,
      parametros: paginacao,
      resposta: paginado(ref('ConsultaDoPaciente'))
    })
  },
  '/consultas/{id}/solicitar': {
    post: operacao({
      tag: 'Consultas (paciente)',
      resumo: 'Solicitar um horário livre',
      descricao: 'Troca atômica: se outro paciente pegou o horário antes, responde 409. Máximo de 5 consultas em aberto.',
      papeis: PAPEL_PACIENTE,
      parametros: [parametroCaminho()],
      resposta: ref('ConsultaDoPaciente'),
      extras: [409, 422]
    })
  },
  '/consultas/{id}/cancelar-solicitacao': {
    post: operacao({
      tag: 'Consultas (paciente)',
      resumo: 'Desistir de uma solicitação (ainda não confirmada)',
      papeis: PAPEL_PACIENTE,
      parametros: [parametroCaminho()],
      ok: 204,
      extras: [409]
    })
  },

  // ---------------------------------------------------------------- Notificações
  '/notificacoes': {
    get: operacao({
      tag: 'Notificações',
      resumo: 'Notificações que enviei',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [
        parametroConsulta('pacienteId', { type: 'string', format: 'uuid' }),
        parametroConsulta('tipo', { type: 'string', enum: Object.values(TIPOS_NOTIFICACAO) }),
        ...paginacao
      ],
      resposta: paginado(ref('Notificacao'))
    }),
    post: operacao({
      tag: 'Notificações',
      resumo: 'Enviar notificação a um paciente (medicamento, consulta ou bem-estar)',
      papeis: PAPEL_PROFISSIONAL,
      corpo: ref('NotificacaoEntrada'),
      ok: 201,
      resposta: ref('Notificacao')
    })
  },
  '/notificacoes/{id}': {
    put: operacao({
      tag: 'Notificações',
      resumo: 'Corrigir notificação enviada',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      corpo: ref('NotificacaoAtualizacao'),
      resposta: ref('Notificacao')
    }),
    delete: operacao({
      tag: 'Notificações',
      resumo: 'Excluir notificação enviada',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      ok: 204
    })
  },
  '/notificacoes/minhas': {
    get: operacao({
      tag: 'Notificações',
      resumo: 'Minhas notificações',
      papeis: PAPEL_PACIENTE,
      parametros: [parametroConsulta('apenasNaoLidas', { type: 'boolean' }), ...paginacao],
      resposta: paginado(ref('Notificacao'))
    })
  },
  '/notificacoes/minhas/nao-lidas': {
    get: operacao({
      tag: 'Notificações',
      resumo: 'Quantidade de notificações não lidas',
      papeis: PAPEL_PACIENTE,
      resposta: { type: 'object', properties: { naoLidas: { type: 'integer', example: 2 } } }
    })
  },
  '/notificacoes/lidas': {
    post: operacao({
      tag: 'Notificações',
      resumo: 'Marcar todas como lidas',
      papeis: PAPEL_PACIENTE,
      resposta: { type: 'object', properties: { marcadas: { type: 'integer', example: 3 } } }
    })
  },
  '/notificacoes/{id}/lida': {
    post: operacao({
      tag: 'Notificações',
      resumo: 'Marcar uma notificação como lida',
      papeis: PAPEL_PACIENTE,
      parametros: [parametroCaminho()],
      ok: 204
    })
  },

  // ---------------------------------------------------------------- Conteúdos
  '/conteudos': {
    get: operacao({
      tag: 'Conteúdos',
      resumo: 'Biblioteca de conteúdos',
      descricao: 'Mostra os conteúdos globais do sistema (ex.: "Evite o estresse!") e os da sua organização.',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [
        parametroConsulta('tipo', { type: 'string', enum: [...TIPOS_CONTEUDO] }),
        parametroConsulta('busca', { type: 'string' }, 'Título ou descrição.'),
        ...paginacao
      ],
      resposta: paginado(ref('Conteudo'))
    }),
    post: operacao({
      tag: 'Conteúdos',
      resumo: 'Cadastrar curso, livro, documentário ou artigo',
      papeis: PAPEL_PROFISSIONAL,
      corpo: ref('ConteudoEntrada'),
      ok: 201,
      resposta: ref('Conteudo')
    })
  },
  '/conteudos/recomendados': {
    get: operacao({
      tag: 'Conteúdos',
      resumo: 'Conteúdos recomendados a mim',
      papeis: PAPEL_PACIENTE,
      parametros: paginacao,
      resposta: paginado(ref('Recomendacao'))
    })
  },
  '/conteudos/{id}': {
    put: operacao({
      tag: 'Conteúdos',
      resumo: 'Atualizar conteúdo (somente o autor)',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      corpo: ref('ConteudoEntrada'),
      resposta: ref('Conteudo')
    }),
    delete: operacao({
      tag: 'Conteúdos',
      resumo: 'Excluir conteúdo (somente o autor; remove as recomendações dele)',
      papeis: PAPEL_PROFISSIONAL,
      parametros: [parametroCaminho()],
      ok: 204
    })
  }
};
