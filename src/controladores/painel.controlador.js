import * as painelServico from '../servicos/painel.servico.js';

export async function obterPainel(req, res) {
  res.json(await painelServico.obterPainel(req.usuario));
}
