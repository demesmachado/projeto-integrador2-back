-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "status_consulta" AS ENUM ('disponivel', 'solicitada', 'confirmada', 'recusada', 'realizada', 'cancelada');

-- CreateEnum
CREATE TYPE "tipo_notificacao" AS ENUM ('medicamento', 'consulta', 'bemEstar');

-- CreateEnum
CREATE TYPE "tipo_conteudo" AS ENUM ('documentario', 'curso', 'livro', 'artigo');

-- CreateTable
CREATE TABLE "organizacoes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administradores" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "versao_token" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "especialidade" VARCHAR(40) NOT NULL,
    "crm" VARCHAR(30),
    "telefone" VARCHAR(11),
    "email" VARCHAR(254) NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "senha_temporaria" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao_token" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "profissional_id" UUID,
    "nome" VARCHAR(120) NOT NULL,
    "email_indice" VARCHAR(64) NOT NULL,
    "dados_cifrados" TEXT NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "senha_temporaria" BOOLEAN NOT NULL DEFAULT true,
    "versao_token" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "paciente_id" UUID,
    "data" DATE NOT NULL,
    "hora" VARCHAR(5) NOT NULL,
    "status" "status_consulta" NOT NULL DEFAULT 'disponivel',
    "dados_clinicos_cifrados" TEXT,
    "realizada_em" TIMESTAMPTZ(3),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolucoes" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "dados_cifrados" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolucoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "tipo" "tipo_notificacao" NOT NULL,
    "conteudo_cifrado" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudos" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID,
    "criado_por_id" UUID,
    "titulo" VARCHAR(150) NOT NULL,
    "tipo" "tipo_conteudo" NOT NULL,
    "descricao" VARCHAR(1000) NOT NULL,
    "url" VARCHAR(500),
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conteudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recomendacoes" (
    "id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recomendacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");

-- CreateIndex
CREATE INDEX "administradores_organizacao_id_idx" ON "administradores"("organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_email_key" ON "profissionais"("email");

-- CreateIndex
CREATE INDEX "profissionais_organizacao_id_nome_idx" ON "profissionais"("organizacao_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_email_indice_key" ON "pacientes"("email_indice");

-- CreateIndex
CREATE INDEX "pacientes_organizacao_id_nome_idx" ON "pacientes"("organizacao_id", "nome");

-- CreateIndex
CREATE INDEX "pacientes_profissional_id_nome_idx" ON "pacientes"("profissional_id", "nome");

-- CreateIndex
CREATE INDEX "consultas_profissional_id_data_hora_idx" ON "consultas"("profissional_id", "data", "hora");

-- CreateIndex
CREATE INDEX "consultas_profissional_id_status_idx" ON "consultas"("profissional_id", "status");

-- CreateIndex
CREATE INDEX "consultas_paciente_id_data_idx" ON "consultas"("paciente_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_profissional_data_hora_key" ON "consultas"("profissional_id", "data", "hora");

-- CreateIndex
CREATE INDEX "evolucoes_paciente_id_criado_em_idx" ON "evolucoes"("paciente_id", "criado_em");

-- CreateIndex
CREATE INDEX "notificacoes_paciente_id_criado_em_idx" ON "notificacoes"("paciente_id", "criado_em");

-- CreateIndex
CREATE INDEX "notificacoes_paciente_id_lida_idx" ON "notificacoes"("paciente_id", "lida");

-- CreateIndex
CREATE INDEX "notificacoes_profissional_id_criado_em_idx" ON "notificacoes"("profissional_id", "criado_em");

-- CreateIndex
CREATE INDEX "conteudos_organizacao_id_criado_em_idx" ON "conteudos"("organizacao_id", "criado_em");

-- CreateIndex
CREATE INDEX "recomendacoes_paciente_id_criado_em_idx" ON "recomendacoes"("paciente_id", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "recomendacoes_conteudo_paciente_key" ON "recomendacoes"("conteudo_id", "paciente_id");

-- AddForeignKey
ALTER TABLE "administradores" ADD CONSTRAINT "administradores_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes" ADD CONSTRAINT "evolucoes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolucoes" ADD CONSTRAINT "evolucoes_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos" ADD CONSTRAINT "conteudos_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudos" ADD CONSTRAINT "conteudos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "profissionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recomendacoes" ADD CONSTRAINT "recomendacoes_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recomendacoes" ADD CONSTRAINT "recomendacoes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recomendacoes" ADD CONSTRAINT "recomendacoes_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===========================================================================
-- Regras escritas à mão (o Prisma não as expressa no schema)
-- ===========================================================================

-- Nome de organização único sem diferenciar maiúsculas/minúsculas.
CREATE UNIQUE INDEX "organizacoes_nome_minusculo_key" ON "organizacoes" (lower("nome"));

-- Vocabulários fechados (a API valida antes; o banco é a última barreira).
ALTER TABLE "organizacoes" ADD CONSTRAINT "organizacoes_tipo_ck"
  CHECK ("tipo" IN ('Hospital', 'Plano de Saúde', 'Organização de Saúde'));

ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_especialidade_ck"
  CHECK ("especialidade" IN ('Médico(a)', 'Enfermeiro(a)', 'Técnico(a) em Enfermagem'));

ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_telefone_ck"
  CHECK ("telefone" IS NULL OR "telefone" ~ '^[0-9]{10,11}$');

-- Hora no formato HH:MM (00:00 a 23:59).
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_hora_ck"
  CHECK ("hora" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Horário livre não tem paciente; qualquer outro status tem.
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_status_paciente_ck"
  CHECK (("status" = 'disponivel') = ("paciente_id" IS NULL));

-- Dados clínicos só existem em consulta realizada, e toda consulta realizada tem o registro.
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_dados_clinicos_ck"
  CHECK (("status" = 'realizada') = ("dados_clinicos_cifrados" IS NOT NULL));

-- ===========================================================================
-- Conteúdos iniciais do sistema (globais: sem organização e sem autor)
-- ===========================================================================
INSERT INTO "conteudos" ("id", "organizacao_id", "criado_por_id", "titulo", "tipo", "descricao", "url")
VALUES
  (
    '5a1f3c1e-8b6d-4d0f-9a43-0c8d1b7e2a01', NULL, NULL,
    'Evite o estresse!', 'documentario',
    'Documentário sobre técnicas de controle do estresse no dia a dia e seus impactos na saúde física e mental.',
    NULL
  ),
  (
    '5a1f3c1e-8b6d-4d0f-9a43-0c8d1b7e2a02', NULL, NULL,
    'Pare de fumar: Malefícios do tabaco!', 'documentario',
    'Conteúdo educativo sobre os riscos do tabagismo para a saúde e orientações para quem deseja parar de fumar.',
    NULL
  );
