const { senhaCorreta, definirCookieLogin } = require('../../lib/session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido.' });
    return;
  }

  const { senha } = req.body || {};
  if (!senhaCorreta(senha)) {
    res.status(401).json({ erro: 'Senha incorreta.' });
    return;
  }

  definirCookieLogin(res);
  res.status(200).json({ ok: true });
};
