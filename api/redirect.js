const { buscarConvitePorSlug } = require('../lib/supabase');
const { slugValido } = require('../lib/slug');

function paginaNaoEncontrada(res) {
  res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html><html lang="pt-BR"><meta charset="UTF-8"><title>Convite não encontrado — UpConvites</title>
<body style="font-family:system-ui,sans-serif;background:#072F3A;color:#FBF6EC;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
<div><h1 style="margin:0 0 8px">Convite não encontrado</h1>
<p style="opacity:.8">Confira se o link está certo.</p>
<a href="/" style="color:#C9A24B">Voltar para a UpConvites</a></div></body></html>`);
}

module.exports = async (req, res) => {
  const slug = String(req.query.slug || '').toLowerCase();

  if (!slugValido(slug)) return paginaNaoEncontrada(res);

  try {
    const convite = await buscarConvitePorSlug(slug);
    if (!convite || !convite.ativo) return paginaNaoEncontrada(res);
    res.writeHead(302, { Location: convite.url_destino });
    res.end();
  } catch (err) {
    console.error('GET /api/redirect falhou:', err);
    res.status(500).send('Erro ao buscar o convite. Tente novamente em instantes.');
  }
};
