const { exigirSessao } = require('../../../lib/session');
const { listarConvites, criarConvite } = require('../../../lib/supabase');
const { normalizar, slugValido } = require('../../../lib/slug');

module.exports = async (req, res) => {
  if (!exigirSessao(req, res)) return;

  if (req.method === 'GET') {
    try {
      res.status(200).json(await listarConvites());
    } catch (err) {
      res.status(500).json({ erro: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const corpo = req.body || {};
    const nomeCliente = String(corpo.nome_cliente || '').trim();
    const slug = normalizar(corpo.slug || corpo.nome_cliente);
    const urlDestino = String(corpo.url_destino || '').trim();

    if (!nomeCliente) return res.status(400).json({ erro: 'Informe o nome do cliente.' });
    if (!slugValido(slug)) return res.status(400).json({ erro: 'Slug inválido. Use só letras, números e hífen (ex.: joao-e-maria).' });
    if (!/^https?:\/\//i.test(urlDestino)) return res.status(400).json({ erro: 'Informe o link de destino completo (https://...).' });

    try {
      const convite = await criarConvite({
        nome_cliente: nomeCliente,
        slug,
        url_destino: urlDestino,
        tipo_evento: corpo.tipo_evento ? String(corpo.tipo_evento).trim() : null,
        observacoes: corpo.observacoes ? String(corpo.observacoes).trim() : null,
        ativo: corpo.ativo !== false,
      });
      res.status(201).json(convite);
    } catch (err) {
      const duplicado = /duplicate key|already exists/i.test(err.message);
      res.status(duplicado ? 409 : 500).json({ erro: duplicado ? 'Já existe um convite com esse slug.' : err.message });
    }
    return;
  }

  res.status(405).json({ erro: 'Método não permitido.' });
};
