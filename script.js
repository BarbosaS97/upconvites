/* =========================================================================
   UPCONVITES — script.js
   JavaScript puro, sem bibliotecas.

   ÍNDICE
   1. CONFIG  <-- ✏️ EDITE AQUI: WhatsApp
   2. Links de contato (WhatsApp)
   3. Ano do rodapé
   4. Menu (cabeçalho e menu mobile)
   5. Animações ao rolar (scroll reveal)
   6. Contagem regressiva do mockup do hero
   7. Contador do painel do cliente
   8. Formulário de contato (abre o WhatsApp)
   9. FAQ (uma pergunta aberta por vez)
   ========================================================================= */

(function () {
  'use strict';

  /* ---------- 1. CONFIG ------------------------------------------------ */
  var CONFIG = {
    // ✏️ EDITAR: número do WhatsApp com código do país + DDD, só números.
    // Exemplo: Brasil (55) + DDD 11 + número 91234-5678  ->  '5511912345678'
    whatsapp: '5561982395208',

    // Mensagem padrão do WhatsApp (botões que não têm uma mensagem própria)
    defaultMessage: 'Olá! Vim pelo site da UpConvites e quero saber mais.'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 2. LINKS DE CONTATO ------------------------------------- */
  // Monta o link do wa.me. Se o texto for omitido, usa a mensagem padrão.
  function waLink(text) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text || CONFIG.defaultMessage);
  }

  // Todo elemento com [data-wa] vira um link para o WhatsApp.
  // Para mudar a mensagem de um botão, use data-wa-msg="..." no HTML.
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    el.href = waLink(el.getAttribute('data-wa-msg'));
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });

  /* ---------- 3. ANO DO RODAPÉ ---------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 4. MENU -------------------------------------------------- */
  var header = document.querySelector('.header');
  var nav = document.getElementById('menu');
  var toggle = document.querySelector('.menu-toggle');

  // Sombra no cabeçalho depois que a página rola
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  // Fecha o menu ao clicar em um link ou apertar Esc
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  // Destaca no menu a seção que está na tela
  var navLinks = document.querySelectorAll('.nav a[href^="#"]:not(.btn)');
  var sections = [];
  navLinks.forEach(function (link) {
    var sec = document.querySelector(link.getAttribute('href'));
    if (sec) sections.push({ link: link, sec: sec });
  });

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sections.forEach(function (s) {
          s.link.classList.toggle('is-active', s.sec === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s.sec); });
  }

  /* ---------- 5. SCROLL REVEAL ---------------------------------------- */
  // Elementos com a classe .reveal aparecem suavemente ao entrar na tela.
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);   // anima só na primeira vez
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    // Navegador antigo ou "reduzir movimento": mostra tudo direto
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 6. CONTAGEM REGRESSIVA (mockup do hero) ------------------ */
  // Só demonstração: conta até 45 dias a partir de agora.
  // Nos convites reais, a data do evento é a do cliente.
  var miniTarget = Date.now() + 45 * 24 * 60 * 60 * 1000;
  var miniEls = {
    d: document.querySelector('[data-mini="d"]'),
    h: document.querySelector('[data-mini="h"]'),
    m: document.querySelector('[data-mini="m"]'),
    s: document.querySelector('[data-mini="s"]')
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  function tickMini() {
    var diff = Math.max(0, miniTarget - Date.now());
    miniEls.d.textContent = pad(Math.floor(diff / 86400000));
    miniEls.h.textContent = pad(Math.floor(diff / 3600000) % 24);
    miniEls.m.textContent = pad(Math.floor(diff / 60000) % 60);
    miniEls.s.textContent = pad(Math.floor(diff / 1000) % 60);
  }
  if (miniEls.d) {
    tickMini();
    setInterval(tickMini, 1000);
  }

  /* ---------- 7. CONTADOR DO PAINEL ----------------------------------- */
  // O número "42" sobe de 0 até 42 quando o mockup aparece na tela.
  var counter = document.querySelector('[data-count-to]');
  if (counter && 'IntersectionObserver' in window && !reduceMotion) {
    var target = parseInt(counter.getAttribute('data-count-to'), 10);
    var counterObs = new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var start = null, duration = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));  // ease-out
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    counterObs.observe(counter);
  }

  /* ---------- 8. FORMULÁRIO DE CONTATO -------------------------------- */
  // Sem servidor: junta os campos numa mensagem e abre o WhatsApp.
  var form = document.getElementById('contact-form');
  var formError = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.elements.nome;
      var email = form.elements.email;
      var mensagem = form.elements.mensagem;

      var nomeOk = nome.value.trim() !== '';
      var msgOk = mensagem.value.trim() !== '';
      nome.classList.toggle('is-invalid', !nomeOk);
      mensagem.classList.toggle('is-invalid', !msgOk);
      formError.hidden = nomeOk && msgOk;
      if (!nomeOk || !msgOk) return;

      var texto = 'Olá! Meu nome é ' + nome.value.trim() + '.\n\n' + mensagem.value.trim();
      if (email.value.trim()) texto += '\n\nMeu e-mail: ' + email.value.trim();

      window.open(waLink(texto), '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---------- 9. FAQ -------------------------------------------------- */
  // Ao abrir uma pergunta, fecha as outras.
  var faqItems = document.querySelectorAll('.faq details');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });
})();
