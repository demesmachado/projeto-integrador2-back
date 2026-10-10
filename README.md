# Backend · Saúde Digital

API REST em **Node.js (JavaScript, ESM) + Express 5 + Prisma 7 + PostgreSQL** que substitui o `localStorage` do front-end (`Saude Digital/`).

Quatro perfis, os mesmos do front:

| Perfil (`papel`) | O que faz |
|---|---|
| `superadmin` | Cadastra organizações (hospital, plano de saúde, organização de saúde) e os administradores delas. Login vem do `.env` (não fica no banco). |
| `admin` | Gerencia os **profissionais** e **pacientes** da própria organização. |
| `profissional` | Agenda (horários, solicitações, registro da consulta), ficha clínica do paciente (histórico, evolução), notificações e conteúdos recomendados. |
| `paciente` | Painel com médias de bpm/glicemia, solicitação de horários, histórico, notificações e conteúdos. |

Documentação interativa (Swagger): `http://localhost:3400/docs`

## Como rodar

Requisitos: Node 20.19+ e um PostgreSQL (o projeto foi pensado para o [Neon](https://neon.tech)).

```bash
npm install
cp .env.example .env     # preencha as variáveis obrigatórias (veja abaixo)
npm run db:setup         # gera o client do Prisma e aplica a migração
npm run dev              # ou: npm start
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | URL do PostgreSQL (`?sslmode=require` no Neon). |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_SENHA` | sim | Login do Super Admin (senha com 10+ caracteres). O `.env.example` traz o mesmo mock do front (`superadm@email.com` / `superadm@senha`): **só para desenvolvimento**. |
| `CHAVE_CRIPTOGRAFIA` | sim | 64 caracteres hexadecimais (32 bytes) para criptografar os dados sensíveis. Gere com `node -p "require('node:crypto').randomBytes(32).toString('hex')"`. |
| `PORT`, `CORS_ORIGINS`, `TRUST_PROXY`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DOCS_ENABLED` | não | Têm padrão seguro; ver `.env.example`. |

> **Guarde a `CHAVE_CRIPTOGRAFIA` com backup, separada do banco.** Sem ela os dados já criptografados (pacientes, consultas, evoluções, notificações) não podem ser lidos, e trocá-la tem o mesmo efeito. Por isso ela é obrigatória e **nunca é derivada** de outras variáveis (já o segredo do JWT, se omitido, é derivado: perdê-lo só derruba as sessões).

> **Neon:** para rodar a migração use a URL de conexão **direta** (sem `-pooler` no host). Depois dela, a URL pooled funciona normalmente para o servidor.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor com reinício automático (`node --watch`) |
| `npm start` | servidor |
| `npm run db:generate` | gera o client do Prisma |
| `npm run db:migrate` | aplica as migrações (`prisma migrate deploy`) |
| `npm run db:setup` | os dois acima em sequência |

## Arquitetura em camadas

```
src/
├── server.js            boot, autoteste da criptografia, timeouts, desligamento limpo
├── app.js               monta o Express e a ordem dos middlewares de segurança
├── config/              ambiente (validado com zod), constantes/limites, CORS
├── rotas/               URLs + corrente de middlewares de cada rota (a segurança fica visível aqui)
├── middlewares/         autenticar, exigirPapel, validar, limitadores, corpoJson, tratadorErros
├── validadores/         esquemas zod (entrada, mensagens em português)   ┐
├── controladores/       HTTP ⇄ serviço (finos)                           │ a requisição
├── servicos/            regras de negócio, autorização e criptografia    │ desce por
├── repositorios/        único lugar que fala com o Prisma                │ estas camadas
├── serializadores/      o que sai para o cliente (DTO)                   ┘
├── banco/               pool pg + PrismaClient
├── utilitarios/         senha, token, cifra, datas, indicadores, telefone, logger...
└── docs/                especificação OpenAPI (Swagger)
prisma/                  schema.prisma + migração inicial
```

Banco (tudo em português): `organizacoes`, `administradores`, `profissionais`, `pacientes`, `consultas`, `evolucoes`, `notificacoes`, `conteudos`, `recomendacoes`.

## Segurança implementada

**Autenticação e sessão**
- Senhas com **bcrypt (custo 12)**, máximo 72 bytes (sem truncar em silêncio). Comparação com hash falso quando a conta não existe: o tempo de resposta não revela quais e-mails existem.
- **JWT HS256** com algoritmo fixado (bloqueia `alg: none`), `iss`/`aud`/`exp` conferidos.
- Cada request autenticado **consulta o banco**: conta excluída, profissional desativado ou token revogado (`versao_token`) perdem o acesso na hora. Logout, troca e redefinição de senha invalidam os tokens antigos.
- Senhas geradas pelo sistema (profissionais e pacientes) têm **6 dígitos**, vêm do gerador criptográfico (`crypto.randomInt`), aparecem **uma única vez** na resposta, ficam marcadas como `senhaTemporaria` e podem ser trocadas em `PUT /autenticacao/senha`. Como 6 dígitos são curtos, o login tem limite **por conta** (10 falhas/hora) além do limite por IP (20 falhas/15 min).

**Dados sensíveis (LGPD)**
- **AES-256-GCM**: sexo, data de nascimento e e-mail do paciente; dados clínicos das consultas (peso, pressão, glicemia, sono...); evoluções; título e mensagem das notificações. Só o nome do paciente fica em texto (busca/ordenação).
- IV aleatório por registro e **AAD** = `tabela.coluna:id`: o conteúdo cifrado de uma linha não decifra em outra (troca de linhas no banco é detectada).
- O e-mail do paciente tem um **índice cego** (HMAC-SHA256 com subchave HKDF): permite login e e-mail único sem guardar o e-mail em texto.
- O hash da senha nunca sai do banco por acidente (`omit` global do Prisma) e nenhuma resposta expõe hash, índice ou texto cifrado.
- Os logs registram só metadados técnicos (nada de corpo, query string, e-mail ou dado de saúde).

**Isolamento e autorização**
- Cada organização só enxerga os próprios dados. Recurso de outra organização/profissional responde **404** (não revela que existe).
- O profissional só acessa os **seus** pacientes. A ficha clínica (histórico de consultas, evolução, recomendações) é restrita ao profissional responsável: **nem o administrador acessa**.
- Trocas de status da agenda são **atômicas** (um `UPDATE` condicional ao status esperado): dois pacientes pedindo o mesmo horário ao mesmo tempo → um recebe 409.

**Entrada e transporte**
- `zod` em todo corpo, query e parâmetro (UUIDs, enums, tamanhos, datas reais do calendário, `.strict()` rejeita campos desconhecidos, sem NUL).
- `helmet`, CORS por lista de origens (em produção, só `CORS_ORIGINS`), `express-rate-limit` (global, login, escrita por usuário, troca de senha), corpo JSON limitado a 32 KB, só `application/json`.
- URLs de conteúdo aceitam apenas `http(s)` (bloqueia `javascript:`).
- Timeouts anti-slowloris, `trust proxy` explícito, `Cache-Control: no-store`, erro 500 sem vazar detalhes, `X-Request-Id` em toda resposta.

## Regras de negócio

**Agenda** — `disponivel → solicitada` (paciente) `→ confirmada | recusada` (profissional) `→ realizada | cancelada`
- Horário não pode ser criado em data passada nem duplicado (mesmo dia e hora).
- O paciente só vê e solicita horários **do seu** profissional; no máximo **5 consultas em aberto**. Só pode desistir enquanto está `solicitada`.
- Registrar a consulta (`POST /agenda/:id/registrar`) exige `confirmada`; todos os campos clínicos são opcionais; o **IMC é calculado no servidor** e as classificações (IMC, bpm, glicemia) acompanham a resposta.
- Só horários `disponivel`, `recusada` ou `cancelada` podem ser excluídos.
- "Hoje" é calculado em `America/Sao_Paulo` (o servidor costuma rodar em UTC).

**Painel do paciente** — média de bpm e glicemia das últimas 100 consultas realizadas, classificada em **Ótimo / Bom / Regular / Ruim** (faixas de referência simplificadas, apenas demonstrativas — ver `utilitarios/indicadores.js`).

**Profissionais e pacientes**
- Profissional com atendimentos ou evoluções **não pode ser excluído** (409): use `ativo: false`, que bloqueia o acesso e preserva o histórico clínico. Sem histórico, a exclusão deixa os pacientes sem responsável.
- Paciente pode ser cadastrado pelo administrador ou pelo profissional (que passa a ser o responsável). Só o administrador exclui paciente (apaga todo o histórico) e reatribui o responsável.
- Evoluções são **imutáveis** (sem edição/exclusão pela API).
- Excluir organização apaga tudo em cascata e exige `?confirmar=true`.

**Conteúdos** — os 2 conteúdos do front ("Evite o estresse!" e "Pare de fumar: Malefícios do tabaco!") vêm na migração como conteúdos **globais** (visíveis a todos, imutáveis). Os que o profissional cria ficam visíveis para a organização dele, e só o autor edita/exclui.

## Endpoints (prefixo `/api/v1`)

| Área | Rotas |
|---|---|
| Sistema | `GET /saude` |
| Autenticação | `POST /autenticacao/entrar` · `POST /autenticacao/sair` · `GET /autenticacao/eu` · `PUT /autenticacao/senha` |
| Painel | `GET /painel` (cada perfil recebe o seu) |
| Organizações (superadmin) | `GET/POST /organizacoes` · `GET/PUT/DELETE /organizacoes/:id` · `GET/POST /organizacoes/:id/administradores` · `PUT/DELETE /administradores/:id` |
| Profissionais (admin) | `GET/POST /profissionais` · `GET/PUT/DELETE /profissionais/:id` · `POST /profissionais/:id/redefinir-senha` |
| Pacientes (admin, profissional) | `GET/POST /pacientes` · `GET/PUT/DELETE /pacientes/:id` · `POST /pacientes/:id/redefinir-senha` |
| Ficha do paciente (profissional) | `GET /pacientes/:id/historico` · `GET/POST /pacientes/:id/evolucoes` · `GET/POST /pacientes/:id/recomendacoes` · `DELETE /pacientes/:id/recomendacoes/:recomendacaoId` |
| Agenda (profissional) | `GET/POST /agenda` · `GET/DELETE /agenda/:id` · `POST /agenda/:id/{confirmar,recusar,cancelar,registrar}` |
| Consultas (paciente) | `GET /consultas/{disponiveis,minhas,historico}` · `POST /consultas/:id/solicitar` · `POST /consultas/:id/cancelar-solicitacao` |
| Notificações | profissional: `GET/POST /notificacoes` · `PUT/DELETE /notificacoes/:id` — paciente: `GET /notificacoes/minhas` · `GET /notificacoes/minhas/nao-lidas` · `POST /notificacoes/lidas` · `POST /notificacoes/:id/lida` |
| Conteúdos | profissional: `GET/POST /conteudos` · `PUT/DELETE /conteudos/:id` — paciente: `GET /conteudos/recomendados` |

Listagens são paginadas (`?pagina=1&limite=20`, máximo 100) e devolvem `{ itens, total, pagina, limite, totalPaginas }`. Erros: `{ erro: { codigo, mensagem, detalhes?, idRequisicao } }`.

## Ajustes necessários no front-end

O front atual guarda tudo no `localStorage` e criptografa no navegador. Para usar esta API:

1. **Login**: `POST /autenticacao/entrar` com `{ papel, email, senha }` (os valores de `papel` são os mesmos do front: `superadmin`, `admin`, `profissional`, `paciente`). Guardar o `token` e enviá-lo em `Authorization: Bearer ...`. Tratar 401 como "sessão expirada".
2. **Senha gerada**: o cadastro de profissional/paciente devolve `senhaGerada` uma única vez (continua sendo mostrada na tela). Ao entrar com `usuario.senhaTemporaria === true`, vale pedir a troca em `PUT /autenticacao/senha`.
3. **Criptografia e hash saem do front**: `storage.js` (AES/SHA-256) deixa de ser necessário; os dados já chegam decifrados nas respostas.
4. **Listas paginadas**: usar `itens`/`total` e passar `busca`, `pagina`, `limite`. Para preencher um `<select>` de profissionais, pedir `?limite=100`.
5. **Campos**: `professionalId` → `profissional: { id, nome, especialidade }`; "BPM" → `frequenciaCardiaca`; `criadoEm` é ISO; horários usam `data` (`AAAA-MM-DD`) + `hora` (`HH:MM`). Os ids continuam UUID.
6. **Consultas**: o paciente solicita em `POST /consultas/:id/solicitar`; o profissional usa `confirmar`/`recusar`/`cancelar`/`registrar`. O IMC não deve ser enviado (o servidor calcula).
7. **Notificações lidas**: o front marcava como lidas ao listar; agora é explícito (`POST /notificacoes/lidas` ou `/:id/lida`).
8. **CORS**: em desenvolvimento qualquer `http://localhost:PORTA` é aceito; em produção liste o domínio do front em `CORS_ORIGINS`.

## Limitações conhecidas

- O limitador de requisições é **em memória**: com mais de uma instância do servidor, cada uma conta separado (trocar o `store` por um compartilhado, como Redis).
- Não há recuperação de senha por e-mail (sem serviço de e-mail no escopo): o administrador gera nova senha temporária (`redefinir-senha`).
- O Super Admin não tem revogação individual de token (expira em 2 h; trocar `SUPERADMIN_SENHA` derruba todos).
- A rotação da `CHAVE_CRIPTOGRAFIA` não é automatizada: o formato `v1.` já prevê versões, mas migrar dados para outra chave exigiria um script.
