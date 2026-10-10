import { LIMITES, PREFIXO_API } from '../config/constantes.js';
import { caminhos } from './caminhos.js';
import { esquemas, ref } from './esquemas.js';

/** Especificação OpenAPI 3.0 servida pelo Swagger UI em /docs. */

const respostaErro = (descricao) => ({
  description: descricao,
  content: { 'application/json': { schema: ref('Erro') } }
});

export const especificacaoOpenApi = {
  openapi: '3.0.3',
  info: {
    title: 'Saúde Digital · API',
    version: '1.0.0',
    description: [
      'API da plataforma **Saúde Digital**, que integra **pacientes**, **profissionais de saúde** (médicos, enfermeiros e técnicos em enfermagem), **administradores** de organizações e o **Super Administrador** do sistema.',
      '',
      '**Como usar:** faça `POST /autenticacao/entrar`, copie o `token` da resposta e clique em **Authorize** (cadeado) para informá-lo.',
      '',
      '**Perfis (`papel`):** `superadmin` (organizações e administradores), `admin` (profissionais e pacientes da sua organização), `profissional` (agenda, ficha clínica, notificações e conteúdos) e `paciente` (painel, consultas, notificações e conteúdos).',
      '',
      '**Segurança dos dados:** senhas só existem como hash (bcrypt). Dados pessoais e de saúde (e-mail, nascimento e sexo do paciente, dados clínicos das consultas, evoluções e notificações) são gravados criptografados (AES-256-GCM). Cada organização só enxerga os próprios dados; recurso de outra organização responde 404.',
      '',
      `**Padrões:** listagens são paginadas (\`pagina\`, \`limite\`; padrão ${LIMITES.paginaPadrao}, máximo ${LIMITES.paginaMaxima}). Erros seguem o formato \`{ erro: { codigo, mensagem, detalhes?, idRequisicao } }\`. Datas no formato \`AAAA-MM-DD\` e horas \`HH:MM\`.`
    ].join('\n')
  },
  servers: [{ url: PREFIXO_API, description: 'Esta instância' }],
  tags: [
    { name: 'Sistema' },
    { name: 'Autenticação' },
    { name: 'Painel' },
    { name: 'Organizações', description: 'Super Admin: organizações e seus administradores.' },
    { name: 'Profissionais', description: 'Administrador: profissionais da organização.' },
    { name: 'Pacientes', description: 'Administrador e profissional: cadastro de pacientes.' },
    { name: 'Ficha do paciente', description: 'Profissional responsável: histórico, evolução e recomendações.' },
    { name: 'Agenda (profissional)', description: 'Horários, solicitações e registro das consultas.' },
    { name: 'Consultas (paciente)', description: 'Solicitar horários e acompanhar consultas.' },
    { name: 'Notificações', description: 'Medicamentos, avisos de consulta e indicadores de bem-estar.' },
    { name: 'Conteúdos', description: 'Cursos, livros, documentários e artigos recomendados.' }
  ],
  paths: caminhos,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: esquemas,
    responses: {
      Erro400: respostaErro('Dados inválidos.'),
      Erro401: respostaErro('Não autenticado, sessão encerrada ou credenciais inválidas.'),
      Erro403: respostaErro('Perfil sem permissão para este recurso.'),
      Erro404: respostaErro('Recurso não encontrado (ou pertence a outra organização/profissional).'),
      Erro409: respostaErro('Conflito (dado duplicado ou ação incompatível com a situação atual).'),
      Erro422: respostaErro('Regra de negócio não atendida.'),
      Erro429: respostaErro('Muitas requisições.'),
      Erro503: respostaErro('Banco de dados indisponível.')
    }
  }
};
