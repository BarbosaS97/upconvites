const { limparCookieLogin } = require('../../lib/session');

module.exports = async (req, res) => {
  limparCookieLogin(res);
  res.status(200).json({ ok: true });
};
