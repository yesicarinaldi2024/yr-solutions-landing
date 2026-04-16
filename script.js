/* =====================================================================
   YR Solutions — Landing Page Scripts
   Principios aplicados (CLAUDE.md):
   - Módulos IIFE para encapsulación y zero polución del scope global
   - Manejo explícito de errores: todo catch loguea y comunica al usuario
   - Funciones con propósito único, máximo ~20 líneas
   - Sin efectos secundarios ocultos
   - Validación en el límite de entrada (formulario = frontera externa)
   ===================================================================== */

'use strict';

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: TOAST — Sistema de notificaciones accesible
   ───────────────────────────────────────────────────────────────────── */
const Toast = (function () {
  const DURATION = 4200;
  const TYPES = { success: '#86efac', error: '#fca5a5', info: '#c084fc' };
  const ICONS = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  };

  function show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `${ICONS[type] || ''}<span>${message}</span>`;
    toast.style.color = TYPES[type] || TYPES.info;
    container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(toast), DURATION);
    toast.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss(toast);
    });
  }

  function dismiss(toast) {
    toast.classList.replace('show', 'hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }

  return { show };
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: NAVBAR — scroll effect + hamburger
   ───────────────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!navbar || !hamburger || !mobileMenu) return;

  // Efecto de scroll
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estado inicial

  // Toggle menú móvil
  function toggleMenu(open) {
    const isOpen = open !== undefined ? open : !hamburger.classList.contains('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.classList.toggle('open', isOpen);
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu());

  // Cerrar al clickear un link interno
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Cerrar al clickear fuera
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') &&
        !navbar.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
      hamburger.focus();
    }
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: SMOOTH SCROLL — anclas internas
   ───────────────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href   = this.getAttribute('href');
      const target = document.querySelector(href);
      if (!target || href === '#') return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: SCROLL SPY — resaltar link activo en navbar
   ───────────────────────────────────────────────────────────────────── */
(function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!sections.length || !navLinks.length) return;

  // Usamos rootMargin para que la sección se active cuando cruza el 20% superior
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
      });
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: BACK TO TOP — botón que aparece al hacer scroll
   ───────────────────────────────────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: CONTADOR ANIMADO
   ───────────────────────────────────────────────────────────────────── */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  if (isNaN(target)) return;

  const duration = 1800;
  const start    = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOutCubic(progress) * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: INTERSECTION OBSERVER — animaciones on-scroll
   ───────────────────────────────────────────────────────────────────── */
(function initObservers() {
  // ── Contadores ──
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-target]').forEach(el => {
    el.textContent = '0';
    counterObserver.observe(el);
  });

  // ── Fade-in escalonado para cards ──
  const fadeSelector = '.service-card, .result-card, .testimonial-card, .process-step, .tech-item';
  const fadeEls = document.querySelectorAll(fadeSelector);

  fadeEls.forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(26px)';
    el.style.willChange = 'opacity, transform';
  });

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, _i) => {
      if (!entry.isIntersecting) return;
      // Calcular delay basado en posición en la grilla
      const siblings = Array.from(entry.target.parentElement.children);
      const idx = siblings.indexOf(entry.target);
      const delay = (idx % 4) * 0.1;
      entry.target.style.transition = `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`;
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach(el => fadeObserver.observe(el));

  // ── Animar línea del proceso ──
  const processLine = document.querySelector('.process-line');
  if (processLine) {
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          processLine.classList.add('animate');
          lineObserver.unobserve(processLine);
        }
      });
    }, { threshold: 0.5 });
    lineObserver.observe(processLine);
  }
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: PARTICLE SYSTEM — canvas de partículas en el hero
   ───────────────────────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, animFrameId;

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width  = parent.offsetWidth;
    H = canvas.height = parent.offsetHeight;
  }

  function createParticles() {
    const density = Math.min(Math.floor((W * H) / 20000), 80);
    return Array.from({ length: density }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r:  Math.random() * 1.4 + 0.4,
      a:  Math.random() * 0.4 + 0.1,
    }));
  }

  function moveParticle(p) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
  }

  function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(168, 85, 247, ${p.a})`;
    ctx.fill();
  }

  function drawConnections() {
    const CONNECTION_DIST = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= CONNECTION_DIST) continue;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.07 * (1 - dist / CONNECTION_DIST)})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { moveParticle(p); drawParticle(p); });
    drawConnections();
    animFrameId = requestAnimationFrame(draw);
  }

  // Pausar cuando la tab no está visible (buena práctica de performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animFrameId);
    } else {
      animFrameId = requestAnimationFrame(draw);
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      particles = createParticles();
    }, 200);
  }, { passive: true });

  resize();
  particles = createParticles();
  draw();
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: VALIDACIÓN DE FORMULARIO
   Aplica principio: validar en la frontera de entrada, mensajes accionables
   ───────────────────────────────────────────────────────────────────── */
const FormValidator = (function () {

  /** Reglas declarativas por campo.
   *  Cada regla: { test: fn => bool, message: string } */
  const RULES = {
    name: [
      { test: v => v.trim().length >= 2,  message: 'El nombre debe tener al menos 2 caracteres.' },
      { test: v => v.trim().length <= 80, message: 'El nombre no puede superar los 80 caracteres.' },
    ],
    email: [
      { test: v => v.trim().length > 0,              message: 'El email es obligatorio.' },
      { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), message: 'Ingresa un email válido (ejemplo: tu@empresa.com).' },
    ],
    phone: [
      // Opcional: si se ingresa, validar formato mínimo
      { test: v => v.trim() === '' || /^[\d\s\+\-\(\)]{6,20}$/.test(v.trim()), message: 'El teléfono ingresado no es válido.' },
    ],
    message: [
      { test: v => v.trim().length >= 20,  message: 'Por favor describe tu proceso con al menos 20 caracteres.' },
      { test: v => v.trim().length <= 800, message: 'El mensaje no puede superar los 800 caracteres.' },
    ],
  };

  /** Valida un campo y actualiza su UI de error.
   *  @returns {boolean} true si el campo es válido */
  function validateField(input) {
    const fieldName = input.name;
    const rules     = RULES[fieldName];
    if (!rules) return true; // sin reglas = siempre válido

    const value   = input.value;
    const errorEl = document.getElementById(`${fieldName}-error`);

    for (const rule of rules) {
      if (!rule.test(value)) {
        setFieldError(input, errorEl, rule.message);
        return false;
      }
    }
    clearFieldError(input, errorEl);
    return true;
  }

  function setFieldError(input, errorEl, message) {
    input.classList.add('error');
    input.classList.remove('valid');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl) {
    input.classList.remove('error');
    if (input.value.trim().length > 0) input.classList.add('valid');
    input.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.textContent = '';
  }

  /** Valida todos los campos con reglas y devuelve si el form es válido */
  function validateAll(form) {
    const fieldsWithRules = Object.keys(RULES);
    let isValid = true;
    let firstInvalid = null;

    fieldsWithRules.forEach(name => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const fieldValid = validateField(input);
      if (!fieldValid && !firstInvalid) firstInvalid = input;
      isValid = isValid && fieldValid;
    });

    if (firstInvalid) firstInvalid.focus();
    return isValid;
  }

  return { validateField, validateAll };
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: CONTACT FORM — lógica completa del formulario
   ───────────────────────────────────────────────────────────────────── */
(function initContactForm() {
  const form       = document.getElementById('contact-form');
  const successEl  = document.getElementById('form-success');
  const resetBtn   = document.getElementById('form-reset-btn');
  const submitBtn  = document.getElementById('submit-btn');
  if (!form || !submitBtn) return;

  const btnText    = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const btnArrow   = submitBtn.querySelector('.btn-arrow');

  // ── Validación on-blur en cada campo ──
  form.querySelectorAll('input[name], textarea[name]').forEach(input => {
    input.addEventListener('blur', () => {
      // Solo validar si el campo fue tocado (tiene valor o fue enfocado)
      if (input.value.trim().length > 0 || input.classList.contains('error')) {
        FormValidator.validateField(input);
      }
    });
    // Limpiar error mientras el usuario corrige
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        FormValidator.validateField(input);
      }
    });
  });

  // ── Contador de caracteres en textarea ──
  const textarea  = form.querySelector('#message');
  const charCount = document.getElementById('message-count');
  const MAX_CHARS = 800;

  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / ${MAX_CHARS}`;
      charCount.classList.toggle('warn',  len > MAX_CHARS * 0.85);
      charCount.classList.toggle('limit', len >= MAX_CHARS);
    });
  }

  // ── Envío del formulario ──
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!FormValidator.validateAll(form)) {
      Toast.show('Por favor corrige los errores antes de enviar.', 'error');
      return;
    }

    setSubmitLoading(true);

    try {
      // NOTE: En producción reemplazar por fetch real al endpoint de backend.
      // Se usa timeout como simulación del envío.
      await simulateFormSubmit(collectFormData(form));
      showSuccessState();
      Toast.show('¡Mensaje enviado! Te contactaremos pronto.', 'success');
    } catch (err) {
      // REGLA-005: nunca silenciar errores — siempre loguear y comunicar
      console.error('[ContactForm] Error al enviar:', err);
      Toast.show('Hubo un error al enviar. Intenta de nuevo o escríbenos por email.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  });

  // ── Botón reset del estado de éxito ──
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (successEl) successEl.hidden = true;
      form.hidden   = false;
      form.reset();
      // Limpiar estados visuales de los campos
      form.querySelectorAll('input, textarea').forEach(el => {
        el.classList.remove('error', 'valid');
        el.removeAttribute('aria-invalid');
      });
      form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
      if (charCount) charCount.textContent = '';
    });
  }

  // ── Helpers internos ──

  function setSubmitLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (btnText)    btnText.textContent  = isLoading ? 'Enviando...' : 'Enviar mensaje';
    if (btnSpinner) btnSpinner.hidden    = !isLoading;
    if (btnArrow)   btnArrow.hidden      = isLoading;
  }

  function showSuccessState() {
    form.hidden             = true;
    if (successEl) successEl.hidden = false;
  }

  /** Recopila los datos del formulario en un objeto plano */
  function collectFormData(formEl) {
    return Object.fromEntries(new FormData(formEl).entries());
  }

  /**
   * Envía los datos del formulario al endpoint del servidor backend.
   * El servidor (server.js) recibe el POST, valida y reenvía por email con Nodemailer.
   *
   * En desarrollo local: el servidor corre en http://localhost:3000
   * En producción:       ajustar CONTACT_API_URL en el servidor o usar variable de entorno.
   *
   * @param {Object} data - Datos del formulario ya validados
   * @returns {Promise<void>}
   */
  async function simulateFormSubmit(data) {
    // Detectar si estamos en producción (mismo origen) o desarrollo local
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000/api/contact'
      : '/api/contact';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Parsear respuesta — siempre intentamos leer el JSON
    let result;
    try {
      result = await response.json();
    } catch {
      // El servidor devolvió algo que no es JSON (ej. error 500 sin body)
      throw new Error(`Error del servidor: HTTP ${response.status}`);
    }

    if (!response.ok) {
      // El servidor devolvió un error con descripción (ej. validación fallida)
      const message = result?.error || `Error al enviar: HTTP ${response.status}`;
      throw new Error(message);
    }
  }
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: TYPEWRITER — efecto de escritura en hero
   Solo se activa en pantallas no reducidas (respeta prefers-reduced-motion)
   ───────────────────────────────────────────────────────────────────── */
(function initTypewriter() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const line2 = document.querySelector('.hero-title-line2');
  if (!line2) return;

  const fullText = line2.textContent.trim();
  line2.textContent = '';
  line2.style.opacity = '1';

  let i = 0;
  const CHAR_DELAY = 55; // ms por caracter

  // Esperar a que el fade-in del título termine antes de escribir
  setTimeout(function typeNextChar() {
    if (i < fullText.length) {
      line2.textContent += fullText[i++];
      setTimeout(typeNextChar, CHAR_DELAY);
    }
  }, 800);
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: HERO TITLE ANIMATION — entrada con stagger
   ───────────────────────────────────────────────────────────────────── */
(function initHeroAnimation() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const elements = [
    document.querySelector('.hero-badge'),
    document.querySelector('.hero-title-line1'),
    document.querySelector('.hero-subtitle'),
    document.querySelector('.hero-cta'),
    document.querySelector('.hero-stats'),
  ];

  elements.forEach((el, i) => {
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s`;
  });

  // Trigger después de un frame para que los estilos iniciales se apliquen
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.forEach(el => {
        if (!el) return;
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: FAQ ACCORDION — apertura/cierre accesible
   ───────────────────────────────────────────────────────────────────── */
(function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Cerrar todos los demás (comportamiento accordion)
      faqItems.forEach(other => {
        const otherBtn    = other.querySelector('.faq-question');
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherBtn && otherAnswer && other !== item) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAnswer.hidden = true;
          other.classList.remove('open');
        }
      });

      // Toggle el clickeado
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.hidden = isOpen;
      item.classList.toggle('open', !isOpen);
    });

    // Navegación con teclado: Flecha abajo/arriba entre preguntas
    btn.addEventListener('keydown', (e) => {
      const items   = Array.from(faqItems);
      const current = items.indexOf(item);
      if (e.key === 'ArrowDown' && current < items.length - 1) {
        e.preventDefault();
        items[current + 1].querySelector('.faq-question')?.focus();
      }
      if (e.key === 'ArrowUp' && current > 0) {
        e.preventDefault();
        items[current - 1].querySelector('.faq-question')?.focus();
      }
    });
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: NEON LASER — rayos adicionales generados dinámicamente
   Crea 3 rayos extra con parámetros aleatorios que se suman a los
   definidos en CSS con ::before y ::after
   ───────────────────────────────────────────────────────────────────── */
(function initNeonLaser() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container = document.querySelector('.neon-laser-bg');
  if (!container) return;

  // Configuración de los rayos adicionales: más rayos con variedad de colores neon
  const rays = [
    // Rayos principales (violeta/azul)
    { left: '30%',  angle: -45, color: '168, 85, 247',  duration: '14s', delay: '1s',  maxOpacity: 0.22 },
    { left: '85%',  angle: -28, color: '99,  102, 241', duration: '10s', delay: '4s',  maxOpacity: 0.18 },
    { left: '15%',  angle: -55, color: '232, 121, 249', duration: '17s', delay: '7s',  maxOpacity: 0.15 },
    // Rayos adicionales (neon azul + verde)
    { left: '60%',  angle: -38, color: '0, 212, 255',   duration: '12s', delay: '2s',  maxOpacity: 0.2  },
    { left: '25%',  angle: -50, color: '0, 255, 136',   duration: '18s', delay: '6s',  maxOpacity: 0.16 },
    { left: '75%',  angle: -22, color: '34, 211, 238',  duration: '15s', delay: '5s',  maxOpacity: 0.17 },
  ];

  rays.forEach(cfg => {
    const ray = document.createElement('div');
    ray.className = 'laser-ray';
    ray.style.cssText = `
      left: ${cfg.left};
      width: 1px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(${cfg.color}, 0) 20%,
        rgba(${cfg.color}, ${cfg.maxOpacity}) 45%,
        rgba(${cfg.color}, ${cfg.maxOpacity * 1.4}) 50%,
        rgba(${cfg.color}, ${cfg.maxOpacity}) 55%,
        rgba(${cfg.color}, 0) 80%,
        transparent 100%
      );
      transform: rotate(${cfg.angle}deg);
      --duration: ${cfg.duration};
      --delay: ${cfg.delay};
      box-shadow: 0 0 6px 1px rgba(${cfg.color}, ${cfg.maxOpacity * 0.4});
    `;
    if (!prefersReduced) container.appendChild(ray);
  });

  // Scanlines horizontales: 4 líneas animadas con fade in/out
  const scanlineConfigs = [
    { duration: '16s', delay: '0s'  },
    { duration: '22s', delay: '8s'  },
    { duration: '20s', delay: '4s'  },
    { duration: '18s', delay: '10s' },
  ];

  scanlineConfigs.forEach(cfg => {
    const line = document.createElement('div');
    line.className = 'neon-scanline';
    line.style.cssText = `--scan-duration: ${cfg.duration}; --scan-delay: ${cfg.delay};`;
    if (!prefersReduced) container.appendChild(line);
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: TECH LOGOS — animación de entrada escalonada
   ───────────────────────────────────────────────────────────────────── */
(function initTechLogos() {
  const logos = document.querySelectorAll('.tech-logo');
  if (!logos.length) return;

  logos.forEach(logo => {
    logo.style.opacity   = '0';
    logo.style.transform = 'translateY(12px)';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const logoList = Array.from(entry.target.querySelectorAll('.tech-logo'));
      logoList.forEach((logo, i) => {
        logo.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
        logo.style.opacity    = '';
        logo.style.transform  = '';
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  const container = document.querySelector('.tech-logos');
  if (container) observer.observe(container);
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: TECH SECTION RAYS — rayos decorativos con fade en tecnología
   Genera rayos adicionales con efecto fade in/out en la sección de tech
   ───────────────────────────────────────────────────────────────────── */
(function initTechSectionRays() {
  const techSection = document.querySelector('.technology');
  if (!techSection) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const rayConfigs = [
    { top: '15%',  left: '20%', angle: -30, duration: '11s', delay: '0s'  },
    { top: '45%',  left: '85%', angle: -50, duration: '13s', delay: '3s'  },
    { top: '70%',  left: '10%', angle: -25, duration: '15s', delay: '6s'  },
    { top: '35%',  left: '75%', angle: -45, duration: '14s', delay: '2s'  },
  ];

  rayConfigs.forEach(cfg => {
    const ray = document.createElement('div');
    ray.style.cssText = `
      position: absolute;
      top: ${cfg.top};
      left: ${cfg.left};
      width: 1px;
      height: 200px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(0, 212, 255, 0.3) 30%,
        rgba(168, 85, 247, 0.4) 50%,
        rgba(0, 255, 136, 0.2) 70%,
        transparent 100%
      );
      transform: rotate(${cfg.angle}deg);
      filter: blur(2px);
      pointer-events: none;
      box-shadow: 0 0 8px 1px rgba(0, 212, 255, 0.2);
      animation: laserFadeInOut ${cfg.duration} ease-in-out infinite ${cfg.delay};
      will-change: opacity;
    `;
    techSection.appendChild(ray);
  });
})();

/* ─────────────────────────────────────────────────────────────────────
   MÓDULO: INNOVATION PARALLAX
   Efecto parallax en la sección de innovación:
   - La escena de fondo se mueve a 0.4x la velocidad del scroll
   - Partículas flotantes en paleta violeta / azul neon / verde neon
   - Respeta prefers-reduced-motion
   ───────────────────────────────────────────────────────────────────── */
(function initInnovationParallax() {
  const section = document.getElementById('innovation-parallax');
  const scene   = document.getElementById('parallax-scene');
  if (!section || !scene) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Parallax scroll ──────────────────────────────────────────────
  if (!prefersReduced) {
    let ticking = false;

    function updateParallax() {
      const rect   = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      // Factor 0.35: la escena se mueve 35% de la distancia del scroll
      scene.style.transform = `translateY(${center * 0.35}px)`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });

    updateParallax(); // estado inicial
  }

  // ── Partículas flotantes ─────────────────────────────────────────
  if (prefersReduced) return;

  const PARTICLE_COLORS = [
    'rgba(0, 212, 255, 0.8)',   // neon blue
    'rgba(0, 255, 136, 0.7)',   // neon green
    'rgba(168, 85, 247, 0.7)',  // violet
    'rgba(192, 132, 252, 0.6)', // purple
    'rgba(34, 211, 238, 0.6)',  // cyan
  ];

  const PARTICLE_COUNT = 28;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'parallax-particle';

    const color    = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const size     = (1.5 + Math.random() * 3).toFixed(1);
    const left     = (5 + Math.random() * 90).toFixed(1);
    const bottom   = (Math.random() * 100).toFixed(1);
    const duration = (6 + Math.random() * 12).toFixed(1);
    const delay    = (Math.random() * 10).toFixed(1);

    p.style.cssText = `
      left: ${left}%;
      bottom: ${bottom}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${parseFloat(size) * 3}px ${color};
      --pr-dur: ${duration}s;
      --pr-delay: -${delay}s;
    `;
    section.appendChild(p);
  }
})();
