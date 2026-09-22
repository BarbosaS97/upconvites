/* ==========================================================================
   UPCONVITES — admin.js
   Painel admin: login por senha única + CRUD dos convites via /api/admin/*.
   ========================================================================= */
(function () {
  'use strict';

  var telaLogin = document.getElementById('tela-login');
  var telaPainel = document.getElementById('tela-painel');
  var formLogin = document.getElementById('form-login');
  var erroLogin = document.getElementById('erro-login');

  var listaEl = document.getElementById('lista-convites');
  var statusEl = document.getElementById('status-lista');
  var btnNovo = document.getElementById('btn-novo');
  var btnSair = document.getElementById('btn-sair');

  var modal = document.getElementById('modal-convite');
  var formConvite = document.getElementById('form-convite');
  var modalTitulo = document.getElementById('modal-titulo');
  var erroModal = document.getElementById('erro-modal');
  var btnCancelar = document.getElementById('btn-cancelar');

  var editandoId = null; // null = criando um novo convite

  function mostrarPainel() {
    telaLogin.hidden = true;
    telaPainel.hidden = false;
    carregarConvites();
  }

  function mostrarLogin() {
    telaPainel.hidden = true;
    telaLogin.hidden = false;
  }

  /* ---------- login ---------- */
  formLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    erroLogin.hidden = true;
    var senha = formLogin.elements.senha.value;

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senha }),
    })
      .then(function (resp) { return resp.ok ? mostrarPainel() : resp.json().then(function (d) { throw new Error(d.erro || 'Senha incorreta.'); }); })
      .catch(function (err) {
        erroLogin.textContent = err.message;
        erroLogin.hidden = false;
        formLogin.elements.senha.value = '';
        formLogin.elements.senha.focus();
      });
  });

  btnSair.addEventListener('click', function () {
    fetch('/api/admin/logout', { method: 'POST' }).finally(mostrarLogin);
  });

  /* ---------- lista de convites ---------- */
  function escapeHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto == null ? '' : String(texto);
    return div.innerHTML;
  }

  function linhaConvite(c) {
    var linkPainel = 'upconvites.com.br/' + c.slug;
    return (
      '<tr data-id="' + c.id + '">' +
        '<td>' + escapeHtml(c.nome_cliente) + (c.tipo_evento ? '<br><small style="color:var(--muted)">' + escapeHtml(c.tipo_evento) + '</small>' : '') + '</td>' +
        '<td><a href="https://' + linkPainel + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(linkPainel) + '</a></td>' +
        '<td><a href="' + escapeHtml(c.url_destino) + '" target="_blank" rel="noopener noreferrer">abrir ↗</a></td>' +
        '<td><span class="admin-badge ' + (c.ativo ? 'admin-badge--ativo">Ativo' : 'admin-badge--inativo">Pausado') + '</span></td>' +
        '<td class="admin-row-actions">' +
          '<button type="button" data-acao="copiar">Copiar link</button>' +
          '<button type="button" data-acao="editar">Editar</button>' +
          '<button type="button" data-acao="excluir">Excluir</button>' +
        '</td>' +
      '</tr>'
    );
  }

  function carregarConvites() {
    statusEl.hidden = false;
    statusEl.textContent = 'Carregando…';
    fetch('/api/admin/convites')
      .then(function (resp) {
        if (resp.status === 401) { mostrarLogin(); throw new Error('sessão expirada'); }
        return resp.json();
      })
      .then(function (convites) {
        statusEl.hidden = true;
        if (!convites.length) {
          listaEl.innerHTML = '<tr><td colspan="5" class="admin-empty">Nenhum convite cadastrado ainda.</td></tr>';
          return;
        }
        listaEl.innerHTML = convites.map(linhaConvite).join('');
      })
      .catch(function () {
        statusEl.hidden = false;
        statusEl.textContent = 'Não foi possível carregar os convites. Recarregue a página.';
      });
  }

  listaEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    var tr = btn.closest('tr');
    var id = tr.dataset.id;

    if (btn.dataset.acao === 'copiar') {
      var linkCompleto = 'https://' + tr.cells[1].textContent.trim();
      navigator.clipboard.writeText(linkCompleto)
        .then(function () { btn.textContent = 'Copiado!'; setTimeout(function () { btn.textContent = 'Copiar link'; }, 1500); });
      return;
    }

    if (btn.dataset.acao === 'excluir') {
      if (!confirm('Excluir este convite? Essa ação não pode ser desfeita.')) return;
      fetch('/api/admin/convites/' + id, { method: 'DELETE' })
        .then(function (resp) { if (!resp.ok && resp.status !== 204) throw new Error(); carregarConvites(); })
        .catch(function () { alert('Não foi possível excluir. Tente de novo.'); });
      return;
    }

    if (btn.dataset.acao === 'editar') {
      fetch('/api/admin/convites')
        .then(function (resp) { return resp.json(); })
        .then(function (convites) {
          var c = convites.find(function (x) { return String(x.id) === id; });
          if (c) abrirModal(c);
        });
    }
  });

  /* ---------- modal: novo / editar ---------- */
  function slugSugerido(nome) {
    return String(nome || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  var slugEditadoManualmente = false;
  formConvite.elements.slug.addEventListener('input', function () { slugEditadoManualmente = true; });
  formConvite.elements.nome_cliente.addEventListener('input', function (e) {
    if (!slugEditadoManualmente) formConvite.elements.slug.value = slugSugerido(e.target.value);
  });

  function abrirModal(convite) {
    formConvite.reset();
    erroModal.hidden = true;
    slugEditadoManualmente = !!convite;
    editandoId = convite ? convite.id : null;
    modalTitulo.textContent = convite ? 'Editar convite' : 'Novo convite';

    if (convite) {
      formConvite.elements.nome_cliente.value = convite.nome_cliente || '';
      formConvite.elements.slug.value = convite.slug || '';
      formConvite.elements.url_destino.value = convite.url_destino || '';
      formConvite.elements.tipo_evento.value = convite.tipo_evento || '';
      formConvite.elements.ativo.checked = convite.ativo !== false;
    } else {
      formConvite.elements.ativo.checked = true;
    }
    modal.showModal();
  }

  btnNovo.addEventListener('click', function () { abrirModal(null); });
  btnCancelar.addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });

  formConvite.addEventListener('submit', function (e) {
    e.preventDefault();
    erroModal.hidden = true;

    var dados = {
      nome_cliente: formConvite.elements.nome_cliente.value.trim(),
      slug: formConvite.elements.slug.value.trim(),
      url_destino: formConvite.elements.url_destino.value.trim(),
      tipo_evento: formConvite.elements.tipo_evento.value.trim(),
      ativo: formConvite.elements.ativo.checked,
    };

    var url = editandoId ? '/api/admin/convites/' + editandoId : '/api/admin/convites';
    var metodo = editandoId ? 'PATCH' : 'POST';

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
      .then(function (resp) { return resp.ok ? resp.json() : resp.json().then(function (d) { throw new Error(d.erro || 'Não foi possível salvar.'); }); })
      .then(function () { modal.close(); carregarConvites(); })
      .catch(function (err) {
        erroModal.textContent = err.message;
        erroModal.hidden = false;
      });
  });

  /* ---------- início: já está logado? (cookie ainda válido) ---------- */
  fetch('/api/admin/convites').then(function (resp) {
    if (resp.ok) mostrarPainel();
  });
})();
