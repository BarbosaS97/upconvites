const { exigirSessao } = require('../../../lib/session');
const { atualizarConvite, excluirConvite } = require('../../../lib/supabase');
const { normalizar, slugValido } = require('../../../lib/slug');

module.exports = async (req, res) => {
  if (!exigirSessao(req, res)) return;
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const corpo = req.body || {};
    const dados = {};

    if (corpo.nome_cliente !== undefined) dados.nome_cliente = String(corpo.nome_cliente).trim();
    if (corpo.url_destino !== undefined) {
      const url = String(corpo.url_destino).trim();
      if (!/^https?:\/\//i.test(url)) return res.status(400).json({ erro: 'Informe o link de destino completo (https://...).' });
      dados.url_destino = url;
    }
    if (corpo.slug !== undefined) {
      const slug = normalizar(corpo.slug);
      if (!slugValido(slug)) return res.status(400).json({ erro: 'Slug inválido. Use só letras, números e hífen.' });
      dados.slug = slug;
    }
    if (corpo.tipo_evento !== undefined) dados.tipo_evento = corpo.tipo_evento ? String(corpo.tipo_evento).trim() : null;
    if (corpo.observacoes !== undefined) dados.observacoes = corpo.observacoes ? String(corpo.observacoes).trim() : null;
    if (corpo.ativo !== undefined) dados.ativo = Boolean(corpo.ativo);

    try {
      const convite = await atualizarConvite(id, dados);
      if (!convite) return res.status(404).json({ erro: 'Convite não encontrado.' });
      res.status(200).json(convite);
    } catch (err) {
      console.error('PATCH /api/admin/convites/[id] falhou:', err);
      const duplicado = /duplicate key|already exists/i.test(err.message);
      res.status(duplicado ? 409 : 500).json({ erro: duplicado ? 'Já existe um convite com esse slug.' : err.message });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await excluirConvite(id);
      res.status(204).end();
    } catch (err) {
      console.error('DELETE /api/admin/convites/[id] falhou:', err);
      res.status(500).json({ erro: err.message });
    }
    return;
  }

  res.status(405).json({ erro: 'Método não permitido.' });
};
