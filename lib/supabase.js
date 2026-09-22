/* ==========================================================================
   Cliente mínimo para a REST API do Supabase (sem depender de nenhuma
   biblioteca — só "fetch", que já existe nas funções da Vercel).
   Usa sempre a chave SUPABASE_SERVICE_ROLE_KEY (nunca a anon), porque quem
   chama isso aqui já é o próprio servidor (painel admin / redirecionamento).
   ========================================================================== */

function base() {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('Variável de ambiente SUPABASE_URL não configurada.');
  return url.replace(/\/+$/, '') + '/rest/v1';
}

function headers(extra) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return Object.assign({
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }, extra);
}

async function falhaSeErro(resp) {
  if (resp.ok) return;
  const texto = await resp.text().catch(() => '');
  throw new Error(`Supabase respondeu ${resp.status}: ${texto}`);
}

async function listarConvites() {
  const resp = await fetch(`${base()}/convites?select=*&order=criado_em.desc`, {
    headers: headers(),
  });
  await falhaSeErro(resp);
  return resp.json();
}

async function buscarConvitePorSlug(slug) {
  const resp = await fetch(`${base()}/convites?slug=eq.${encodeURIComponent(slug)}&select=url_destino,ativo&limit=1`, {
    headers: headers(),
  });
  await falhaSeErro(resp);
  const linhas = await resp.json();
  return linhas[0] || null;
}

async function criarConvite(dados) {
  const resp = await fetch(`${base()}/convites`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(dados),
  });
  await falhaSeErro(resp);
  const linhas = await resp.json();
  return linhas[0];
}

async function atualizarConvite(id, dados) {
  const resp = await fetch(`${base()}/convites?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(dados),
  });
  await falhaSeErro(resp);
  const linhas = await resp.json();
  return linhas[0] || null;
}

async function excluirConvite(id) {
  const resp = await fetch(`${base()}/convites?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  await falhaSeErro(resp);
}

module.exports = {
  listarConvites,
  buscarConvitePorSlug,
  criarConvite,
  atualizarConvite,
  excluirConvite,
};
