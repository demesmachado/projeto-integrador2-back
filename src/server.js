import { criarApp } from './app.js';
import { banco, desconectarBanco } from './banco/cliente.js';
import { ambiente } from './config/ambiente.js';
import { cifrarJson, decifrarJson } from './utilitarios/cifra.js';
import { registrador, resumirErro } from './utilitarios/registrador.js';
import { obterHashSuperAdmin } from './utilitarios/senha.js';

/** Falha cedo se a criptografia não estiver funcionando (ex.: runtime sem suporte a AES-GCM). */
function autoTesteDaCriptografia() {
  const amostra = { ok: true };
  const resultado = decifrarJson(cifrarJson(amostra, 'autoteste'), 'autoteste');
  if (resultado?.ok !== true) throw new Error('Autoteste da criptografia falhou.');
}

async function iniciar() {
  autoTesteDaCriptografia();

  // Falha cedo e de forma clara se o banco estiver inacessível ou as migrações não foram aplicadas.
  try {
    await banco.organizacao.count();
  } catch (erro) {
    registrador.erro('banco_inacessivel_ou_sem_migracoes', {
      dica: 'Confira DATABASE_URL e rode: npm run db:setup',
      ...resumirErro(erro)
    });
    process.exit(1);
  }

  await obterHashSuperAdmin(); // calcula o hash agora, para o primeiro login não ficar lento

  if (ambiente.ehProducao && ambiente.origensCors.length === 0) {
    registrador.aviso('CORS_ORIGINS vazio: nenhum site conseguirá chamar a API pelo navegador');
  }
  if (ambiente.ehProducao && ambiente.confiarProxy === 0) {
    registrador.aviso('TRUST_PROXY=0: se houver proxy reverso (Render, etc.), o limite de taxa verá o IP do proxy');
  }

  const servidor = criarApp().listen(ambiente.porta, () => {
    registrador.info('servidor_iniciado', {
      porta: ambiente.porta,
      ambiente: ambiente.ehProducao ? 'production' : 'development',
      docs: ambiente.docsAtivo ? '/docs' : 'desativada'
    });
  });

  // Defesas contra conexões lentas/penduradas (slowloris). Os corpos são pequenos (32 KB), então 30 s sobram.
  servidor.headersTimeout = 20_000;
  servidor.requestTimeout = 30_000;
  servidor.keepAliveTimeout = 65_000; // maior que o idle timeout típico de balanceadores (60 s)

  let encerrando = false;
  async function encerrar(sinal) {
    if (encerrando) return;
    encerrando = true;
    registrador.info('encerrando', { sinal });
    const forcar = setTimeout(() => process.exit(1), 10_000).unref();
    servidor.close(async () => {
      await desconectarBanco();
      clearTimeout(forcar);
      process.exit(0);
    });
    servidor.closeIdleConnections();
  }

  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

// Estado desconhecido: registrar e sair (o gerenciador de processos reinicia) é mais seguro que continuar.
process.on('unhandledRejection', (erro) => {
  registrador.erro('promessa_rejeitada_sem_tratamento', resumirErro(erro));
  process.exit(1);
});
process.on('uncaughtException', (erro) => {
  registrador.erro('excecao_nao_capturada', resumirErro(erro));
  process.exit(1);
});

iniciar();
