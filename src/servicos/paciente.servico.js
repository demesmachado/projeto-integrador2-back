import { randomUUID } from 'node:crypto';
import { PAPEIS } from '../config/constantes.js';
import * as pacienteRepositorio from '../repositorios/paciente.repositorio.js';
import { serializarPaciente } from '../serializadores/paciente.serializador.js';
import { cifrarDadosPaciente, decifrarDadosPaciente, indiceEmailPaciente } from '../utilitarios/dadosPaciente.js';
import { conflito, proibido } from '../utilitarios/erros.js';
import { calcularDeslocamento, respostaPaginada } from '../utilitarios/paginacao.js';
import { gerarHashSenha, gerarSenhaTemporaria } from '../utilitarios/senha.js';
import { exigirPacienteAcessivel, exigirProfissionalDaOrganizacao } from './acesso.servico.js';

/**
 * Cadastro de pacientes, feito pelo administrador (qualquer paciente da organização) ou pelo profissional
 * (que fica como responsável pelos pacientes que cadastra). Sexo, data de nascimento e e-mail são
 * gravados criptografados; só o nome fica em texto (busca e ordenação).
 */

const MENSAGEM_EMAIL_EM_USO = 'Já existe um paciente com este e-mail.';

const ehProfissional = (ator) => ator.papel === PAPEIS.PROFISSIONAL;

async function garantirEmailLivre(indice, ignorarId) {
  const existente = await pacienteRepositorio.buscarPorIndiceEmail(indice);
  if (existente && existente.id !== ignorarId) {
    throw conflito(MENSAGEM_EMAIL_EM_USO, [{ campo: 'corpo.email', mensagem: MENSAGEM_EMAIL_EM_USO }]);
  }
}

/** O profissional responsável precisa existir e ser da mesma organização do ator. */
async function validarProfissionalResponsavel(ator, profissionalId) {
  if (!profissionalId) return null;
  const profissional = await exigirProfissionalDaOrganizacao(ator, profissionalId);
  return profissional.id;
}

export async function listar(ator, consulta) {
  const filtros = {
    organizacaoId: ator.organizacaoId,
    // O profissional só enxerga os próprios pacientes; o administrador pode filtrar por responsável.
    profissionalId: ehProfissional(ator) ? ator.id : consulta.profissionalId,
    busca: consulta.busca
  };
  const [itens, total] = await Promise.all([
    pacienteRepositorio.listar({ ...filtros, ...calcularDeslocamento(consulta) }),
    pacienteRepositorio.contar(filtros)
  ]);
  return respostaPaginada(
    itens.map((paciente) => serializarPaciente(paciente, decifrarDadosPaciente(paciente))),
    total,
    consulta
  );
}

export async function obter(ator, id) {
  const paciente = await exigirPacienteAcessivel(ator, id);
  return serializarPaciente(paciente, decifrarDadosPaciente(paciente));
}

export async function criar(ator, dados) {
  const emailIndice = indiceEmailPaciente(dados.email);
  await garantirEmailLivre(emailIndice);

  const profissionalId = ehProfissional(ator)
    ? ator.id
    : await validarProfissionalResponsavel(ator, dados.profissionalId);

  const id = randomUUID(); // gerado aqui porque o id faz parte do contexto da criptografia
  const senhaGerada = gerarSenhaTemporaria();
  const paciente = await pacienteRepositorio.criar({
    id,
    organizacaoId: ator.organizacaoId,
    profissionalId,
    nome: dados.nome,
    emailIndice,
    dadosCifrados: cifrarDadosPaciente(id, {
      sexo: dados.sexo,
      dataNascimento: dados.dataNascimento,
      email: dados.email
    }),
    senhaHash: await gerarHashSenha(senhaGerada),
    senhaTemporaria: true
  });

  return { paciente: serializarPaciente(paciente, decifrarDadosPaciente(paciente)), senhaGerada };
}

export async function atualizar(ator, id, dados) {
  const atual = await exigirPacienteAcessivel(ator, id);

  const emailIndice = indiceEmailPaciente(dados.email);
  await garantirEmailLivre(emailIndice, id);

  const alteracoes = {
    nome: dados.nome,
    emailIndice,
    dadosCifrados: cifrarDadosPaciente(id, {
      sexo: dados.sexo,
      dataNascimento: dados.dataNascimento,
      email: dados.email
    })
  };

  if (dados.profissionalId !== undefined) {
    if (ehProfissional(ator)) {
      // Para o profissional, "reenviar o próprio id" é inofensivo; qualquer outra mudança é só do administrador.
      if (dados.profissionalId !== ator.id) {
        throw proibido('Somente o administrador pode alterar o profissional responsável.');
      }
    } else {
      alteracoes.profissionalId = await validarProfissionalResponsavel(ator, dados.profissionalId);
    }
  }

  // Trocar o e-mail muda o login do paciente: derruba as sessões abertas.
  if (emailIndice !== atual.emailIndice) alteracoes.versaoToken = { increment: 1 };

  const paciente = await pacienteRepositorio.atualizar(id, alteracoes);
  return serializarPaciente(paciente, decifrarDadosPaciente(paciente));
}

/** Exclusão (e de todo o histórico do paciente, em cascata) é restrita ao administrador. */
export async function excluir(administrador, id) {
  await exigirPacienteAcessivel(administrador, id);
  await pacienteRepositorio.excluir(id);
}

/** Gera nova senha temporária e encerra as sessões abertas do paciente. */
export async function redefinirSenha(ator, id) {
  await exigirPacienteAcessivel(ator, id);

  const senhaGerada = gerarSenhaTemporaria();
  await pacienteRepositorio.atualizar(id, {
    senhaHash: await gerarHashSenha(senhaGerada),
    senhaTemporaria: true,
    versaoToken: { increment: 1 }
  });
  return { senhaGerada };
}
