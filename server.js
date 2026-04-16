/**
 * YR Solutions — Servidor de Email (Backend)
 *
 * Stack: Node.js + Express + Nodemailer
 * Principios aplicados (CLAUDE.md):
 *   REGLA-001 — Configuración exclusivamente por variables de entorno (.env)
 *   REGLA-005 — Nunca silenciar errores: todo se loguea y comunica al cliente
 *   Sección 5.4 — Rate limiting para proteger el endpoint de abuso
 *   Sección 6.2 — Validación y sanitización de todos los inputs externos
 *   Sección 6.3 — Rate limiting en endpoint de contacto
 *   Sección 11.2 — Fallo inmediato si variables de entorno requeridas no están
 */

'use strict';

// ─── Dependencias ────────────────────────────────────────────────────
const path       = require('path');
const express    = require('express');
const nodemailer = require('nodemailer');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const cors       = require('cors');
require('dotenv').config();

// ─── Validación de entorno en el arranque ────────────────────────────
// (CLAUDE.md 11.2: fallo inmediato con mensaje descriptivo si faltan vars)
const REQUIRED_ENV = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];
const missingVars = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `[ERROR] Variables de entorno requeridas no configuradas: ${missingVars.join(', ')}\n` +
    'Copia .env.example a .env y completa los valores antes de iniciar el servidor.'
  );
  process.exit(1);
}

// ─── Configuración ───────────────────────────────────────────────────
const PORT         = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV     = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// ─── Instancia Express ───────────────────────────────────────────────
const app = express();

// ─── Middlewares de seguridad ─────────────────────────────────────────
// Cabeceras HTTP de seguridad (CLAUDE.md §6)
app.use(helmet({
  // Content-Security-Policy: restringida al mínimo necesario para una API
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'none'"],
      scriptSrc:      ["'none'"],
      styleSrc:       ["'none'"],
      imgSrc:         ["'none'"],
      connectSrc:     ["'self'"],
      frameAncestors: ["'none'"],
      formAction:     ["'none'"],
    },
  },
  // Prevenir clickjacking
  frameguard: { action: 'deny' },
  // No inferir MIME desde contenido
  noSniff: true,
  // Referrer mínimo — no filtrar URL interna en peticiones externas
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // HSTS: forzar HTTPS en producción (1 año, incluir subdomains)
  hsts: NODE_ENV === 'production'
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,
  // Evitar detección de XSS legacy (IE)
  xssFilter: true,
  // Deshabilitar detección de tipo en IE
  ieNoOpen: true,
}));

// CORS: lista blanca estricta; solo IPs/dominios conocidos
const CORS_ALLOWED = NODE_ENV === 'production'
  ? [FRONTEND_URL]
  : [FRONTEND_URL, 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    // Sin origen = request same-origin o herramienta como curl (solo en dev)
    if (!origin) {
      return NODE_ENV === 'development'
        ? cb(null, true)
        : cb(new Error('CORS: se requiere cabecera Origin en producción'));
    }
    if (CORS_ALLOWED.includes(origin)) {
      cb(null, true);
    } else {
      console.warn(`[CORS] Origen rechazado: ${origin}`);
      cb(new Error(`CORS: origen no permitido — ${origin}`));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600, // Cachear preflight 10 minutos
}));

// Parseo de JSON con límite de tamaño (prevenir payload attacks)
app.use(express.json({ limit: '16kb' }));

// Servir el frontend como archivos estáticos en producción
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname)));
}

// ─── Rate Limiting (CLAUDE.md §6.3) ─────────────────────────────────
// Máximo 5 solicitudes por IP cada 15 minutos para el endpoint de contacto
const contactLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    error: 'Demasiados mensajes enviados. Por favor espera 15 minutos e intenta nuevamente.',
  },
  handler: (req, res, _next, options) => {
    console.warn(`[RateLimit] IP bloqueada: ${req.ip} — ${new Date().toISOString()}`);
    res.status(429).json(options.message);
  },
});

// ─── Transporte de email ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465', // true para SSL (port 465), false para TLS (port 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Timeout para evitar colgarse indefinidamente
  connectionTimeout: 10_000,
  greetingTimeout:   5_000,
  socketTimeout:     10_000,
});

// Verificar conexión SMTP al arranque (no bloquea el servidor)
transporter.verify((err) => {
  if (err) {
    console.error('[SMTP] Error al conectar con el servidor de email:', err.message);
    console.error('[SMTP] Verifica EMAIL_HOST, EMAIL_PORT, EMAIL_USER y EMAIL_PASS en .env');
  } else {
    console.info('[SMTP] Conexión verificada — servidor de email listo.');
  }
});

// ─── Validación de campos del formulario ─────────────────────────────
/**
 * Valida los datos recibidos del formulario.
 * Principio: validar en la frontera de entrada, mensajes accionables.
 * @param {Object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
// Límites de longitud por campo (protección adicional contra payloads maliciosos)
const FIELD_LIMITS = {
  name:    { min: 2,  max: 100 },
  email:   { min: 6,  max: 254 },  // RFC 5321
  company: { min: 0,  max: 120 },
  phone:   { min: 0,  max: 20  },
  service: { min: 0,  max: 80  },
  message: { min: 20, max: 800 },
};

function validateContactBody(body) {
  const errors = [];

  const name    = String(body.name    ?? '').trim();
  const email   = String(body.email   ?? '').trim().toLowerCase();
  const message = String(body.message ?? '').trim();
  const phone   = String(body.phone   ?? '').trim();
  const company = String(body.company ?? '').trim();
  const service = String(body.service ?? '').trim();

  if (name.length < FIELD_LIMITS.name.min || name.length > FIELD_LIMITS.name.max) {
    errors.push(`El nombre debe tener entre ${FIELD_LIMITS.name.min} y ${FIELD_LIMITS.name.max} caracteres.`);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > FIELD_LIMITS.email.max) {
    errors.push('El email no es válido.');
  }
  if (message.length < FIELD_LIMITS.message.min) {
    errors.push(`El mensaje debe tener al menos ${FIELD_LIMITS.message.min} caracteres.`);
  }
  if (message.length > FIELD_LIMITS.message.max) {
    errors.push(`El mensaje no puede superar los ${FIELD_LIMITS.message.max} caracteres.`);
  }
  if (phone && (!/^[\d\s+\-()]{1,20}$/.test(phone) || phone.length > FIELD_LIMITS.phone.max)) {
    errors.push('El teléfono contiene caracteres no válidos (máx. 20).');
  }
  if (company.length > FIELD_LIMITS.company.max) {
    errors.push(`El nombre de empresa no puede superar ${FIELD_LIMITS.company.max} caracteres.`);
  }
  if (service.length > FIELD_LIMITS.service.max) {
    errors.push(`El campo servicio no puede superar ${FIELD_LIMITS.service.max} caracteres.`);
  }

  return { valid: errors.length === 0, errors };
}

/** Sanitiza un string: recorta y escapa HTML básico */
function sanitize(str) {
  return String(str ?? '')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── ENDPOINT: POST /api/contact ─────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  // Validación de entrada
  const { valid, errors } = validateContactBody(req.body);
  if (!valid) {
    return res.status(422).json({
      error: errors.join(' '),
      fields: errors,
    });
  }

  // Sanitización
  const name    = sanitize(req.body.name);
  const email   = sanitize(req.body.email);
  const company = sanitize(req.body.company || '');
  const phone   = sanitize(req.body.phone   || '');
  const service = sanitize(req.body.service || '');
  const message = sanitize(req.body.message);

  // Construir el email de notificación para YR Solutions
  const mailToAdmin = {
    from:    `"YR Solutions — Formulario Web" <${process.env.EMAIL_USER}>`,
    to:      process.env.EMAIL_TO,
    replyTo: email,
    subject: `[YR Solutions] Nuevo contacto: ${name}${company ? ` · ${company}` : ''}`,
    text: [
      `Nuevo mensaje recibido desde el formulario de contacto.`,
      ``,
      `DATOS DEL CONTACTO`,
      `──────────────────`,
      `Nombre:   ${name}`,
      `Email:    ${email}`,
      `Empresa:  ${company || '—'}`,
      `Teléfono: ${phone   || '—'}`,
      `Servicio: ${service || '—'}`,
      ``,
      `MENSAJE`,
      `───────`,
      message,
      ``,
      `──────────────────`,
      `Recibido: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`,
      `IP: ${req.ip}`,
    ].join('\n'),
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; margin:0; padding:20px; }
          .card { background:#fff; border-radius:12px; padding:32px; max-width:600px; margin:0 auto; border-top:4px solid #a855f7; }
          h1 { font-size:1.4rem; color:#1e293b; margin:0 0 24px; }
          .field { margin-bottom:16px; }
          .label { font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; }
          .value { font-size:0.95rem; color:#1e293b; margin-top:4px; }
          .message-box { background:#f8fafc; border-radius:8px; padding:16px; border-left:3px solid #a855f7; font-size:0.95rem; color:#1e293b; white-space:pre-wrap; }
          .footer { margin-top:24px; font-size:0.78rem; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
          .badge { display:inline-block; padding:4px 12px; background:#f3e8ff; border-radius:100px; color:#7e22ce; font-size:0.78rem; font-weight:600; margin-bottom:20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">📩 Nuevo contacto — YR Solutions</div>
          <h1>Nuevo mensaje desde el formulario web</h1>
          <div class="field"><div class="label">Nombre</div><div class="value">${name}</div></div>
          <div class="field"><div class="label">Email</div><div class="value"><a href="mailto:${email}">${email}</a></div></div>
          ${company ? `<div class="field"><div class="label">Empresa</div><div class="value">${company}</div></div>` : ''}
          ${phone   ? `<div class="field"><div class="label">Teléfono</div><div class="value">${phone}</div></div>` : ''}
          ${service ? `<div class="field"><div class="label">Servicio de interés</div><div class="value">${service}</div></div>` : ''}
          <div class="field">
            <div class="label">Mensaje</div>
            <div class="message-box">${message}</div>
          </div>
          <div class="footer">
            Recibido el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} · IP: ${req.ip}
          </div>
        </div>
      </body>
      </html>
    `,
  };

  // Email de confirmación automática para el contacto
  const mailToContact = {
    from:    `"YR Solutions" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Recibimos tu mensaje, ${name.split(' ')[0]} 👋`,
    text: [
      `Hola ${name.split(' ')[0]},`,
      ``,
      `Recibimos tu mensaje y nos pondremos en contacto contigo en menos de 24 horas hábiles.`,
      ``,
      `Mientras tanto, podés revisar nuestros servicios en: https://www.yrsolutions.com.ar`,
      ``,
      `¡Gracias por confiar en YR Solutions!`,
      ``,
      `—`,
      `El equipo de YR Solutions`,
      `hola@yrsolutions.com.ar`,
    ].join('\n'),
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; margin:0; padding:20px; }
          .card { background:#fff; border-radius:12px; padding:32px; max-width:560px; margin:0 auto; border-top:4px solid #a855f7; }
          h1 { font-size:1.5rem; color:#1e293b; margin:0 0 12px; }
          p  { color:#475569; font-size:0.95rem; line-height:1.6; }
          .btn { display:inline-block; margin-top:20px; padding:12px 24px; background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.9rem; }
          .footer { margin-top:28px; font-size:0.78rem; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
          .logo { font-size:1.2rem; font-weight:900; color:#a855f7; margin-bottom:20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">YR Solutions</div>
          <h1>¡Recibimos tu mensaje! 🚀</h1>
          <p>Hola <strong>${name.split(' ')[0]}</strong>,</p>
          <p>Gracias por contactarnos. Recibimos tu consulta y uno de nuestros especialistas se pondrá en contacto contigo en <strong>menos de 24 horas hábiles</strong>.</p>
          <p>Mientras tanto, podés explorar nuestros servicios y casos de éxito en nuestra web.</p>
          <a href="https://www.yrsolutions.com.ar" class="btn">Ver nuestros servicios →</a>
          <div class="footer">
            © 2025 YR Solutions · <a href="mailto:hola@yrsolutions.com.ar" style="color:#a855f7">hola@yrsolutions.com.ar</a><br/>
            Argentina · Trabajo remoto global
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // Enviar ambos emails en paralelo
    await Promise.all([
      transporter.sendMail(mailToAdmin),
      transporter.sendMail(mailToContact),
    ]);

    console.info(`[ContactForm] Mensaje enviado — ${name} <${email}> — ${new Date().toISOString()}`);
    return res.status(200).json({ ok: true, message: 'Mensaje enviado correctamente.' });

  } catch (err) {
    // REGLA-005: nunca silenciar errores — loguear con contexto completo
    console.error('[ContactForm] Error al enviar email:', {
      message: err.message,
      code:    err.code,
      from:    email,
      time:    new Date().toISOString(),
    });
    return res.status(500).json({
      error: 'No pudimos enviar tu mensaje en este momento. Por favor intenta de nuevo o escríbenos directamente a hola@yrsolutions.com.ar',
    });
  }
});

// ─── Health check ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Catch-all: servir index.html en producción (SPA) ────────────────
if (NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// ─── Manejo global de errores no capturados ─────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Express] Error no manejado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ─── Iniciar servidor ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.info(`\n✅ YR Solutions — Servidor iniciado`);
  console.info(`   Entorno:  ${NODE_ENV}`);
  console.info(`   Puerto:   ${PORT}`);
  console.info(`   URL:      http://localhost:${PORT}`);
  console.info(`   Email:    ${process.env.EMAIL_USER} → ${process.env.EMAIL_TO}\n`);
});

module.exports = app; // Exportar para tests
