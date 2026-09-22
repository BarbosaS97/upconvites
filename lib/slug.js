/* Slugs viram parte da URL (upconvites.com.br/<slug>), então precisam ser
   só letras minúsculas, números e hífen — e não podem colidir com as
   rotas de verdade do site (admin, api, etc.). */

const RESERVADOS = new Set([
  'admin', 'api', 'assets', 'favicon', 'index', 'robots.txt', 'sitemap.xml',
  'sobre', 'como-funciona', 'portfolio', 'recursos', 'faq', 'contato', 'painel',
]);

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugValido(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && !RESERVADOS.has(slug);
}

module.exports = { normalizar, slugValido };
