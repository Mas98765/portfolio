/* =========================================================
   MarcioSud — Portfólio
   JavaScript puro (sem dependências)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Atalhos ---------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Foto de perfil: fallback com iniciais ----------
     Se img/perfil.jpg não existir, mostra "MS" dentro da moldura. */
  var profileImg = $('#profileImg');
  if (profileImg) {
    var frame = profileImg.closest('.photo-frame');
    var showFallback = function () { if (frame) frame.classList.add('no-photo'); };
    profileImg.addEventListener('error', showFallback);
    // Caso a imagem já tenha falhado antes de o script carregar
    if (profileImg.complete && profileImg.naturalWidth === 0) showFallback();
  }

  /* ---------- 2. Menu hambúrguer (mobile) ---------- */
  var navToggle = $('#navToggle');
  var nav = $('#nav');

  function setMenu(open) {
    navToggle.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setMenu(!nav.classList.contains('is-open'));
    });

    // Fecha ao escolher um link
    $$('.nav__link', nav).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    // Fecha com a tecla Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    });

    // Garante estado limpo ao voltar para telas grandes
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && nav.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- 3. Links placeholder (href="#") não devem "pular" a página ---------- */
  $$('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- 4. Navbar: fundo ao rolar + barra de progresso ---------- */
  var navbar = $('#navbar');
  var progress = $('#scrollProgress');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (navbar) navbar.classList.toggle('is-scrolled', y > 20);
    if (progress && max > 0) progress.style.width = (y / max * 100) + '%';
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- 5. Link ativo no menu conforme a seção visível ---------- */
  var sections = $$('main section[id]');
  var navLinks = $$('.nav__link');

  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- 6. Animações de entrada ao rolar ---------- */
  var revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // anima apenas uma vez
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    // Sem suporte ou movimento reduzido: mostra tudo
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 7. Contadores animados (seção Sobre) ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    if (prefersReducedMotion) { el.textContent = target; return; }

    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(target * eased);
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = '0';
    window.requestAnimationFrame(step);
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { counterObserver.observe(c); });
  }

  /* ---------- 8. Timeline interativa (acordeão) ---------- */
  var timelineItems = $$('.timeline__item');

  function setItem(item, open) {
    var btn = $('.timeline__toggle', item);
    item.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }

  timelineItems.forEach(function (item) {
    var btn = $('.timeline__toggle', item);
    if (!btn) return;

    // Estado inicial definido no HTML via aria-expanded
    setItem(item, btn.getAttribute('aria-expanded') === 'true');

    btn.addEventListener('click', function () {
      setItem(item, !item.classList.contains('is-open'));
    });
  });

  /* ---------- 9. Lightbox dos prints dos projetos ---------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lastTrigger = null;

  function openLightbox(trigger) {
    var img = $('img', trigger);
    if (!img || !lightbox) return;
    lastTrigger = trigger;
    lightboxImg.src = img.getAttribute('src');
    lightboxImg.alt = img.getAttribute('alt') || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lightboxClose').focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  if (lightbox) {
    $$('[data-lightbox]').forEach(function (btn) {
      btn.addEventListener('click', function () { openLightbox(btn); });
    });
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- 10. Modal de vídeo (demonstrações) ---------- */
  var videoModal = $('#videoModal');
  var videoPlayer = $('#videoPlayer');
  var videoError = $('#videoError');
  var videoTitle = $('#videoModalTitle');
  var videoTrigger = null;

  function openVideo(btn) {
    if (!videoModal) return;
    videoTrigger = btn;
    videoTitle.textContent = btn.getAttribute('data-video-title') || 'Demonstração';
    videoError.hidden = true;
    videoPlayer.hidden = false;
    videoPlayer.poster = btn.getAttribute('data-poster') || '';
    videoPlayer.src = btn.getAttribute('data-video');
    videoModal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#videoModalClose').focus();
    var p = videoPlayer.play();
    if (p && p.catch) p.catch(function () { /* o usuário pode iniciar manualmente */ });
  }

  function closeVideo() {
    if (!videoModal || videoModal.hidden) return;
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    videoModal.hidden = true;
    document.body.style.overflow = '';
    if (videoTrigger) videoTrigger.focus();
  }

  if (videoModal && videoPlayer) {
    $$('[data-video]').forEach(function (btn) {
      btn.addEventListener('click', function () { openVideo(btn); });
    });
    // Se o arquivo não existir, avisa em vez de mostrar um player vazio
    videoPlayer.addEventListener('error', function () {
      if (videoPlayer.getAttribute('src')) {
        videoPlayer.hidden = true;
        videoError.hidden = false;
      }
    });
    $('#videoModalClose').addEventListener('click', closeVideo);
    videoModal.addEventListener('click', function (e) { if (e.target === videoModal) closeVideo(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeVideo(); });
  }
})();
