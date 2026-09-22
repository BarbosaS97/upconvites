/* ==========================================================================
   Sessão simples do painel admin: uma senha única (ADMIN_PASSWORD) e um
   cookie assinado (HMAC) para não pedir a senha de novo a cada clique.
   Sem biblioteca de autenticação — só "crypto", que já vem no Node.
   ========================================================================== */
const crypto = require('crypto');

const NOME_COOKIE = 'upconvites_admin';
const DURACAO_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function assinar(payload) {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error('Variável de ambiente SESSION_SECRET não configurada.');
  return crypto.createHmac('sha256', segredo).update(payload).digest('hex');
}

function compararSeguro(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Confere a senha enviada no login contra ADMIN_PASSWORD (tempo constante). */
function senhaCorreta(senhaEnviada) {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada || !senhaEnviada) return false;
  // padroniza o tamanho antes de comparar para não vazar o tamanho da senha certa
  const a = crypto.createHash('sha256').update(String(senhaEnviada)).digest('hex');
  const b = crypto.createHash('sha256').update(String(esperada)).digest('hex');
  return compararSeguro(a, b);
}

/** Gera o valor do cookie de sessão (payload + expiração + assinatura). */
function criarValorSessao() {
  const expira = Date.now() + DURACAO_MS;
  const payload = `admin.${expira}`;
  return `${payload}.${assinar(payload)}`;
}

function sessaoValida(valorCookie) {
  if (!valorCookie) return false;
  const partes = valorCookie.split('.');
  if (partes.length !== 3) return false;
  const [tipo, expira, assinatura] = partes;
  if (tipo !== 'admin') return false;
  if (!compararSeguro(assinar(`${tipo}.${expira}`), assinatura)) return false;
  return Number(expira) > Date.now();
}

function lerCookies(req) {
  const cru = req.headers.cookie || '';
  return Object.fromEntries(
    cru.split(';').map((par) => par.trim()).filter(Boolean).map((par) => {
      const i = par.indexOf('=');
      return [decodeURIComponent(par.slice(0, i)), decodeURIComponent(par.slice(i + 1))];
    })
  );
}

/** true = sessão válida. Se for inválida, já responde 401 e retorna false. */
function exigirSessao(req, res) {
  const cookies = lerCookies(req);
  if (sessaoValida(cookies[NOME_COOKIE])) return true;
  res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  return false;
}

function definirCookieLogin(res) {
  const valor = criarValorSessao();
  const seguro = process.env.VERCEL ? '; Secure' : ''; // permite testar em http://localhost
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=${encodeURIComponent(valor)}; Max-Age=${DURACAO_MS / 1000}; Path=/; HttpOnly${seguro}; SameSite=Lax`);
}

function limparCookieLogin(res) {
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

module.exports = {
  senhaCorreta,
  exigirSessao,
  definirCookieLogin,
  limparCookieLogin,
};
