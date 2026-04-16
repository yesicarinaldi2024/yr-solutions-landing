# CLAUDE.md — Lineamientos de Desarrollo de Clase Mundial

> **Autor:** Fullstack Engineer & Automation Specialist  
> **Versión:** 1.0.0  
> **Alcance:** Desarrollo de software, automatización de pruebas, automatización de procesos y arquitectura de aplicaciones.  
> **Filosofía central:** *El código se escribe una vez, pero se lee cientos de veces. Escríbelo para humanos primero, para máquinas después.*

---

## ÍNDICE

1. [Reglas Absolutas — Nunca Se Rompen](#1-reglas-absolutas--nunca-se-rompen)
2. [Principios de Arquitectura y Diseño](#2-principios-de-arquitectura-y-diseño)
3. [Estándares de Código](#3-estándares-de-código)
4. [Automatización de Pruebas](#4-automatización-de-pruebas)
5. [Automatización de Procesos](#5-automatización-de-procesos)
6. [Seguridad](#6-seguridad)
7. [Control de Versiones y Colaboración](#7-control-de-versiones-y-colaboración)
8. [CI/CD y DevOps](#8-cicd-y-devops)
9. [Rendimiento y Observabilidad](#9-rendimiento-y-observabilidad)
10. [Documentación](#10-documentación)
11. [Gestión del Entorno y Configuración](#11-gestión-del-entorno-y-configuración)
12. [Inteligencia Artificial y Uso de Herramientas Asistidas](#12-inteligencia-artificial-y-uso-de-herramientas-asistidas)

---

## 1. REGLAS ABSOLUTAS — NUNCA SE ROMPEN

> Estas reglas no son sugerencias. Son restricciones no negociables. Cualquier PR, tarea o decisión que las viole será rechazada sin excepción.

### 🔴 REGLA-001 — CERO SECRETOS EN CÓDIGO FUENTE
**Nunca** comitear credenciales, tokens, claves API, contraseñas, certificados o cualquier secreto directamente en el repositorio. Sin excepción, sin "es solo temporal".

```
✅ Usar: variables de entorno, gestores de secretos (Vault, AWS Secrets Manager, Doppler)
❌ Jamás: API_KEY = "sk-abc123..." en cualquier archivo del repo
```

### 🔴 REGLA-002 — NUNCA PUSHEAR A MAIN/MASTER DIRECTAMENTE
Todo cambio entra por Pull Request. Todo PR requiere al menos una revisión aprobada antes de hacer merge. Sin excepciones, incluyendo "hotfixes urgentes".

### 🔴 REGLA-003 — LAS PRUEBAS SON OBLIGATORIAS, NO OPCIONALES
Ningún feature nuevo se entrega sin pruebas que lo respalden. Cobertura mínima del 80% en lógica de negocio crítica. Un bug sin prueba de regresión no está resuelto, solo está escondido.

### 🔴 REGLA-004 — EL CÓDIGO QUE NO SE PUEDE LEER, NO SE ACEPTA
Si un desarrollador con 2 años de experiencia en el stack no puede entender el propósito de una función en menos de 60 segundos, el código necesita ser refactorizado. La complejidad sin justificación es deuda técnica intencional.

### 🔴 REGLA-005 — NUNCA SILENCIAR ERRORES
```python
# ❌ JAMÁS — Esto oculta bugs durante meses
try:
    do_something()
except Exception:
    pass

# ✅ SIEMPRE — Manejar, loguear o relanzar
try:
    do_something()
except SpecificException as e:
    logger.error("Fallo en do_something: %s", e)
    raise
```

### 🔴 REGLA-006 — NUNCA DESPLEGAR EN VIERNES O ANTES DE VACACIONES
Los despliegues a producción no se realizan los viernes, vísperas de feriados ni cuando el equipo de guardia no esté disponible para responder incidentes.

### 🔴 REGLA-007 — SIN DATOS REALES EN ENTORNOS DE NO-PRODUCCIÓN
Los entornos de desarrollo, staging y testing jamás contienen datos reales de usuarios o clientes. Se usan datos sintéticos o anonimizados siempre.

### 🔴 REGLA-008 — TODA DEPENDENCIA EXTERNA DEBE SER EVALUADA
Antes de agregar una nueva librería o dependencia, se evalúa: mantenimiento activo, licencia compatible, vulnerabilidades conocidas y tamaño del impacto. No se añaden dependencias de forma impulsiva.

---

## 2. PRINCIPIOS DE ARQUITECTURA Y DISEÑO

### 2.1 Principios SOLID — No Negociables

| Principio | Regla práctica |
|-----------|----------------|
| **S**ingle Responsibility | Una clase/módulo = una razón para cambiar |
| **O**pen/Closed | Extender comportamiento sin modificar código existente |
| **L**iskov Substitution | Las subclases deben poder reemplazar a sus padres sin romper nada |
| **I**nterface Segregation | Interfaces pequeñas y específicas, no monolíticas |
| **D**ependency Inversion | Depender de abstracciones, nunca de implementaciones concretas |

### 2.2 Principios DRY, KISS y YAGNI

- **DRY (Don't Repeat Yourself):** Si copias y pegas código más de dos veces, extráelo en una función o módulo reutilizable.
- **KISS (Keep It Simple, Stupid):** La solución más simple que funciona correctamente es la mejor solución.
- **YAGNI (You Aren't Gonna Need It):** No construyas funcionalidad que "podría necesitarse en el futuro". Construye lo que se necesita hoy.

### 2.3 Diseño Orientado al Dominio (DDD)

- El lenguaje del negocio debe reflejarse en el código (Ubiquitous Language).
- Separar claramente: Capa de Dominio / Capa de Aplicación / Capa de Infraestructura.
- Los Aggregates deben proteger sus invariantes de negocio sin exposición directa de estado interno.

### 2.4 Arquitectura de Capas y Módulos

```
src/
├── domain/          # Entidades, Value Objects, reglas de negocio puras
├── application/     # Casos de uso, orquestación de servicios
├── infrastructure/  # DB, APIs externas, mensajería, filesystem
├── interfaces/      # Controllers, CLI, WebSockets, REST handlers
└── shared/          # Utilidades transversales, DTOs, constantes
```

La dependencia siempre va hacia adentro: `interfaces → application → domain`. **Nunca al revés.**

### 2.5 Patrones de Diseño

- Usar patrones de diseño cuando resuelven un problema real, nunca para "parecer sofisticado".
- Documentar **por qué** se eligió un patrón específico, no solo cuál se usó.
- Favorecer composición sobre herencia siempre que sea posible.

---

## 3. ESTÁNDARES DE CÓDIGO

### 3.1 Nombrado — La Regla de Oro

> *Un buen nombre elimina la necesidad de un comentario.*

```python
# ❌ Malo
def calc(x, y, z):
    return x * y - z

# ✅ Bueno
def calculate_net_salary(gross_salary, tax_rate, deductions):
    return gross_salary * (1 - tax_rate) - deductions
```

**Convenciones:**
- **Variables/funciones:** `snake_case` (Python, Rust) | `camelCase` (JS/TS, Java)
- **Clases:** `PascalCase` en todos los lenguajes
- **Constantes:** `UPPER_SNAKE_CASE`
- **Privado/interno:** prefijo `_` o `__` según convención del lenguaje
- **Booleanos:** prefijo `is_`, `has_`, `can_`, `should_` → `is_active`, `has_permission`
- **Funciones:** verbo + sustantivo → `get_user`, `create_order`, `validate_payment`

### 3.2 Funciones

- Máximo **20 líneas** por función (regla orientativa, no dogmática).
- Máximo **3 parámetros** directos; si necesitas más, usa un objeto/DTO.
- Una función hace **una sola cosa**. Si su nombre contiene "y", probablemente hace dos cosas.
- Sin efectos secundarios ocultos. Las funciones puras son preferibles.

### 3.3 Comentarios

```python
# ❌ Comentario inútil — solo repite el código
# Incrementa el contador
counter += 1

# ✅ Comentario valioso — explica el POR QUÉ, no el QUÉ
# Usamos exponential backoff para evitar thundering herd en el API externo
retry_delay = base_delay * (2 ** attempt)

# ✅ También válido — marcar decisiones arquitectónicas importantes
# NOTE: Este cálculo usa UTC explícitamente para evitar bugs en zonas horarias
# durante el cambio de horario de verano. Ver issue #412.
```

### 3.4 Manejo de Errores

- Usar excepciones específicas y tipadas, nunca genéricas.
- Toda excepción atrapada debe ser: manejada, relanzada o logueada. Las tres opciones son válidas. El silencio no.
- Los mensajes de error deben ser accionables: decir QUÉ falló y DÓNDE, no solo "algo falló".
- Diseñar APIs con el patrón `Result<T, E>` o equivalente cuando los errores son parte del flujo esperado (no excepciones).

### 3.5 Formato y Linting

- El formato del código se define por herramientas automáticas (Prettier, Black, gofmt, rustfmt). Los debates de "tabs vs espacios" no existen: la herramienta decide.
- Los linters deben correr como parte del pre-commit hook y del pipeline CI. Código con warnings de linter bloqueados en CI no llega a main.
- La configuración del linter/formatter **vive en el repositorio** y es idéntica para todos los miembros del equipo.

---

## 4. AUTOMATIZACIÓN DE PRUEBAS

### 4.1 La Pirámide de Pruebas

```
          /\
         /  \
        / E2E \       ← Pocas, lentas, costosas. Solo flujos críticos de negocio.
       /--------\
      / Integración \  ← Medias. Verifican contratos entre módulos y servicios.
     /--------------\
    /    Unitarias    \  ← Muchas, rápidas, baratas. Lógica pura de negocio.
   /------------------\
```

**Ratio recomendado:** 70% unitarias / 20% integración / 10% E2E.

### 4.2 Reglas de Oro para Pruebas

**F.I.R.S.T:**
- **F**ast — Las pruebas unitarias deben correr en milisegundos.
- **I**ndependent — Ninguna prueba depende del estado que dejó otra prueba.
- **R**epeatable — El mismo resultado en cualquier entorno, siempre.
- **S**elf-validating — Resultado binario: PASS o FAIL. Sin interpretación manual.
- **T**imely — Las pruebas se escriben con o antes del código de producción.

### 4.3 Estructura de una Prueba — Patrón AAA

```python
def test_should_apply_discount_when_user_is_premium():
    # ARRANGE — Preparar el estado inicial
    user = User(type=UserType.PREMIUM)
    cart = Cart(items=[Item(price=100.0)])
    discount_service = DiscountService()

    # ACT — Ejecutar la acción bajo prueba
    final_price = discount_service.apply(cart, user)

    # ASSERT — Verificar el resultado esperado
    assert final_price == 85.0  # 15% de descuento premium
```

### 4.4 Qué Testear — Qué No Testear

**Testear siempre:**
- Lógica de negocio y reglas de dominio
- Casos borde y valores límite
- Flujos de error y excepciones esperadas
- Transformaciones de datos
- Contratos de APIs (consumer-driven contracts)

**No testear:**
- Getters/setters triviales sin lógica
- Configuración de frameworks (ya están testeados por sus autores)
- Código generado automáticamente

### 4.5 Automatización E2E

- Las pruebas E2E corren sobre entornos dedicados con datos de prueba controlados.
- Usar el patrón **Page Object Model (POM)** para UI tests. Nunca selectores hardcodeados dispersos por el test.
- Los selectores deben usar atributos semánticos (`data-testid`, roles ARIA) preferidos sobre clases CSS o XPath frágiles.
- Las pruebas E2E deben ser **idempotentes**: pueden correr N veces sin dejar estado sucio.
- Los timeouts deben ser explícitos y justificados. Nada de `sleep(5)` sin razón documentada.

```typescript
// ❌ Frágil — rompe con cualquier cambio de CSS
await page.click('.btn-primary > span:nth-child(2)')

// ✅ Robusto — intención clara, resistente a refactors de UI
await page.getByTestId('submit-order-button').click()
```

### 4.6 Mocking y Doubles de Prueba

- Mockear en el límite de la capa (infraestructura/externa), nunca en el núcleo del dominio.
- Preferir **fakes** funcionales sobre **mocks** cuando el comportamiento importa.
- Nunca mockear lo que no es tuyo: mockear la interfaz/abstracción, no la librería de terceros directamente.

### 4.7 Mutation Testing

- Periódicamente ejecutar mutation testing (Mutmut, PIT, Stryker) para validar la calidad real de las pruebas.
- Un test que nunca falla con mutaciones probablemente no está probando nada útil.

---

## 5. AUTOMATIZACIÓN DE PROCESOS

### 5.1 Principios de Automatización

- **Automatizar lo repetible:** Si un proceso manual se ejecuta más de 3 veces, es candidato a automatización.
- **Idempotencia:** Toda automatización debe poder ejecutarse múltiples veces sin producir efectos indeseados. Si ya está hecho, debe detectarlo y no duplicar.
- **Observabilidad desde el diseño:** Toda automatización debe emitir logs estructurados, métricas y alertas desde el primer día.
- **Fallo explícito:** Un proceso automatizado que falla silenciosamente es más peligroso que uno que no existe.

### 5.2 Diseño de Scripts y Workflows

```bash
# Todo script de automatización debe incluir:
# 1. Cabecera descriptiva con propósito, autor y fecha
# 2. Modo strict/fail-fast
set -euo pipefail

# 3. Variables claramente nombradas con valores por defecto seguros
ENVIRONMENT="${ENVIRONMENT:-staging}"
MAX_RETRIES="${MAX_RETRIES:-3}"

# 4. Logging estructurado
log_info()  { echo "[INFO]  $(date -u +%FT%TZ) $*"; }
log_error() { echo "[ERROR] $(date -u +%FT%TZ) $*" >&2; }

# 5. Limpieza ante errores (trap)
cleanup() { log_info "Limpiando recursos temporales..."; rm -f /tmp/lock_$$; }
trap cleanup EXIT
```

### 5.3 Gestión de Estado en Automatizaciones

- Los pipelines de automatización deben ser **stateless** siempre que sea posible.
- Cuando se requiere estado, debe ser externo, persistente y auditado (DB, S3, Redis).
- Diseñar pensando en **reinicios parciales**: ¿qué pasa si el proceso se interrumpe en el paso 7 de 10?

### 5.4 Manejo de Rate Limits y APIs Externas

```python
# Siempre implementar retry con backoff exponencial + jitter
import time
import random

def call_with_retry(func, max_attempts=3, base_delay=1.0):
    for attempt in range(max_attempts):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_attempts - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            logger.warning("Rate limit alcanzado. Reintento en %.2fs", delay)
            time.sleep(delay)
```

### 5.5 Orquestación de Workflows

- Preferir herramientas declarativas para workflows complejos (Airflow, Prefect, Temporal, GitHub Actions).
- Cada paso del workflow debe ser atómico y verificable de forma independiente.
- Implementar **dead letter queues** para mensajes/tareas que fallaron repetidamente.
- Las tareas de larga duración deben tener timeouts explícitos y mecanismos de cancelación.

### 5.6 Automatización de Infraestructura (IaC)

- Toda infraestructura se define como código. No se crean recursos manualmente en producción.
- Los cambios de infraestructura pasan por el mismo proceso de review que el código.
- Usar `plan`/`dry-run` antes de aplicar cualquier cambio destructivo.
- Los recursos de infraestructura deben tener tags/labels que identifiquen: entorno, equipo, proyecto y fecha de creación.

---

## 6. SEGURIDAD

### 6.1 Modelo de Amenazas

- Incorporar el pensamiento de seguridad desde el diseño (Secure by Design), no como capa posterior.
- Toda feature que maneje datos de usuarios o dinero debe pasar por una revisión básica de threat modeling.
- Principio de **mínimo privilegio**: los servicios, usuarios y procesos tienen solo los permisos estrictamente necesarios.

### 6.2 Validación y Sanitización de Entradas

```python
# ❌ Jamás confiar en el input del usuario directamente
query = f"SELECT * FROM users WHERE email = '{user_input}'"  # SQL Injection

# ✅ Siempre usar parámetros preparados
cursor.execute("SELECT * FROM users WHERE email = %s", (user_input,))

# ✅ Validar y tipar el input antes de procesarlo
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str  # min_length definido en el modelo
```

### 6.3 Autenticación y Autorización

- Nunca implementar criptografía propia. Usar librerías auditadas y estándares (bcrypt, argon2, JWT con firmas asimétricas).
- Los tokens deben tener expiración. Sin tokens eternos en producción.
- Separar claramente **autenticación** (¿quién eres?) de **autorización** (¿qué puedes hacer?).
- Implementar rate limiting en todos los endpoints de autenticación.

### 6.4 Dependencias y Supply Chain

- Ejecutar `npm audit`, `pip-audit`, `trivy` o equivalente en cada CI build.
- Fijar versiones de dependencias con lock files (`package-lock.json`, `poetry.lock`, `Cargo.lock`). Nunca usar rangos abiertos (`*`, `>=`) en producción.
- Revisar y actualizar dependencias con vulnerabilidades críticas en menos de 48 horas.

### 6.5 Logging de Seguridad

- Loguear eventos de seguridad: intentos de login fallidos, cambios de permisos, acceso a datos sensibles.
- **Nunca** loguear: contraseñas, tokens, números de tarjetas, datos personales completos.
- Los logs de seguridad deben ser inmutables y con retención mínima de 90 días.

---

## 7. CONTROL DE VERSIONES Y COLABORACIÓN

### 7.1 Estrategia de Branching

**Git Flow simplificado (recomendado):**
```
main          ← producción, siempre desplegable
├── develop   ← integración, base de features
│   ├── feature/TICKET-123-user-authentication
│   ├── feature/TICKET-456-payment-gateway
│   └── fix/TICKET-789-null-pointer-cart
└── hotfix/TICKET-999-critical-payment-fix  ← desde main, merge a main Y develop
```

### 7.2 Commits — Conventional Commits

Formato: `<tipo>(<scope>): <descripción>`

```
feat(auth): implementar login con OAuth2
fix(cart): corregir cálculo de descuentos con cupones combinados
docs(api): agregar ejemplos de request/response en endpoints de usuarios
refactor(payment): extraer lógica de validación de tarjetas a PaymentValidator
test(orders): agregar pruebas de integración para cancelación de pedidos
chore(deps): actualizar dependencias de seguridad (lodash 4.17.20 → 4.17.21)
```

**Reglas del commit:**
- El título describe QUÉ cambia, no CÓMO (eso va en el código).
- Presente imperativo: "agregar", "corregir", "eliminar" — no "agregué", "corrigiendo".
- Máximo 72 caracteres en el título.
- El cuerpo del commit explica el POR QUÉ cuando no es obvio.

### 7.3 Pull Requests

Un buen PR:
- Tiene un título claro que incluye el número de ticket.
- Tiene una descripción que explica el contexto, decisiones tomadas y cómo probar.
- Es pequeño y enfocado: idealmente < 400 líneas de cambio. Si es más grande, dividirlo.
- Incluye capturas/videos de UI si hay cambios visuales.
- No tiene `TODO` o `FIXME` recientes sin ticket asociado.

Un buen code review:
- Aprueba lo que funciona, no lo que le gusta al revisor.
- Los comentarios son sobre el código, nunca sobre la persona.
- Distingue entre: blocker (debe cambiar), suggestion (podría mejorar) y nit (cosmético).
- Se responde en menos de 24 horas hábiles.

---

## 8. CI/CD Y DEVOPS

### 8.1 Pipeline de CI — Requisitos Mínimos

Todo pipeline de integración continua debe ejecutar en este orden:

```
1. Lint & Format Check     ← Falla rápido si hay problemas de estilo
2. Build                   ← Compilar/transpilar el proyecto
3. Unit Tests              ← Lógica pura, sin dependencias externas
4. Integration Tests       ← Con dependencias levantadas (Docker Compose)
5. Security Scan           ← Dependencias vulnerables, SAST
6. Coverage Check          ← Falla si la cobertura baja del umbral definido
7. Build Docker Image      ← Solo si todo lo anterior pasó
8. Push to Registry        ← Solo desde ramas protegidas
```

### 8.2 Principios de Deployment

- **Blue/Green o Canary** para cambios de alto riesgo en producción.
- Toda feature grande va detrás de **feature flags**. Desplegar es diferente a activar.
- Los deployments deben ser **reversibles en menos de 5 minutos** (rollback automatizado).
- Los health checks deben estar implementados antes de cualquier despliegue a producción.

### 8.3 Ambientes

| Ambiente | Propósito | Datos | Quién despliega |
|----------|-----------|-------|-----------------|
| `local` | Desarrollo individual | Sintéticos | Desarrollador |
| `dev` | Integración continua | Sintéticos | CI automático |
| `staging` | QA y validación | Anonimizados | CI + aprobación |
| `production` | Usuarios reales | Reales | CD + aprobación humana |

### 8.4 Docker y Contenedores

```dockerfile
# ✅ Usar imágenes base mínimas y específicas
FROM python:3.12-slim

# ✅ Crear usuario no-root
RUN useradd --create-home appuser
USER appuser

# ✅ Copiar solo lo necesario (usar .dockerignore agresivo)
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=appuser:appuser src/ ./src/

# ✅ Exponer solo el puerto necesario
EXPOSE 8080

# ✅ Health check incluido
HEALTHCHECK --interval=30s --timeout=10s \
  CMD curl -f http://localhost:8080/health || exit 1
```

---

## 9. RENDIMIENTO Y OBSERVABILIDAD

### 9.1 Rendimiento — Reglas Fundamentales

- **Medir antes de optimizar.** La optimización prematura sin datos es la raíz de muchos males.
- Definir y publicar **SLOs (Service Level Objectives)** antes de optimizar: ¿cuál es "rápido enough"?
- Los problemas de N+1 queries deben ser detectados en code review, no en producción.
- Indexar las columnas usadas en JOINs, WHERE y ORDER BY. Revisar el plan de ejecución de queries complejas.

### 9.2 Los Tres Pilares de la Observabilidad

**Logs — Estructurados siempre:**
```python
# ❌ Log sin estructura — inútil para búsquedas automáticas
logger.info(f"Usuario {user_id} realizó compra de {amount}")

# ✅ Log estructurado — permite búsqueda, filtrado y alertas automáticas
logger.info("purchase.completed", extra={
    "user_id": user_id,
    "amount": amount,
    "currency": "USD",
    "payment_method": payment_method,
    "correlation_id": request.correlation_id,
})
```

**Métricas — Lo que se debe medir siempre:**
- Tasa de solicitudes (RPS)
- Latencia P50, P95, P99 (no promedios)
- Tasa de errores por endpoint
- Uso de recursos: CPU, memoria, conexiones de DB

**Traces — Distributed Tracing:**
- Propagar `correlation_id` / `trace_id` en todos los servicios y logs.
- Los spans deben estar instrumentados en operaciones de IO (DB, HTTP, queue).

### 9.3 Alertas

- Una alerta sin acción definida es ruido. Toda alerta debe tener un runbook.
- Alertar sobre síntomas del usuario (latencia alta, errores 5xx), no solo sobre causas técnicas (CPU al 80%).
- Los umbrales de alerta se revisan trimestralmente. Las alertas que nunca se disparan o siempre son falsos positivos se eliminan o ajustan.

---

## 10. DOCUMENTACIÓN

### 10.1 Documentación como Código

- La documentación vive en el repositorio, junto al código que documenta.
- La documentación desactualizada es peor que no tener documentación: activamente engaña.
- Los ADRs (Architecture Decision Records) documentan el **por qué** de las decisiones importantes, no solo el qué.

### 10.2 Estructura Mínima de README

```markdown
# Nombre del Proyecto

## ¿Qué hace este proyecto? (2-3 líneas)

## Prerrequisitos

## Setup en 5 minutos (quickstart)

## Cómo correr las pruebas

## Variables de entorno requeridas

## Arquitectura de alto nivel (diagrama si aplica)

## Cómo contribuir

## Contacto / equipo responsable
```

### 10.3 Documentación de API

- Toda API pública o interna tiene documentación OpenAPI/Swagger actualizada y generada automáticamente.
- Los endpoints documentan: propósito, parámetros, esquemas de request/response, códigos de error posibles y ejemplos reales.
- La documentación de API se versiona junto con el código.

### 10.4 ADR — Architecture Decision Records

```markdown
# ADR-001: Uso de PostgreSQL como base de datos principal

**Fecha:** 2025-03-15  
**Estado:** Aceptado  
**Decisores:** Equipo Backend

## Contexto
Necesitamos persistencia transaccional con soporte a consultas complejas...

## Decisión
Usaremos PostgreSQL 16 como base de datos principal.

## Consecuencias
- ✅ ACID compliance nativo
- ✅ Excelente soporte para JSON semi-estructurado
- ❌ Mayor overhead operacional que soluciones gestionadas más simples
```

---

## 11. GESTIÓN DEL ENTORNO Y CONFIGURACIÓN

### 11.1 Los 12 Factores — Base Obligatoria

Todo servicio sigue los principios de [The Twelve-Factor App](https://12factor.net/):
- Configuración en variables de entorno, nunca hardcodeada.
- Dependencias declaradas explícitamente (nunca asumir herramientas del sistema).
- Procesos stateless; el estado vive en servicios externos.
- Logs como streams de eventos, nunca escritos a archivos locales.

### 11.2 Gestión de Configuración

```
.env.example    ← En el repo. Plantilla con todas las vars necesarias (sin valores reales)
.env            ← NUNCA en el repo. Valores reales locales. En .gitignore.
.env.test       ← En el repo solo si tiene valores de prueba no sensibles.
```

Toda variable de entorno requerida que no esté presente debe causar un **fallo inmediato en el arranque** del servicio con un mensaje descriptivo. Nunca usar valores por defecto inseguros en producción.

### 11.3 Compatibilidad y Versiones

- Fijar versiones de runtime en archivos de configuración (`.nvmrc`, `.python-version`, `go.mod`).
- Los cambios de versión de runtime son un cambio coordinado: todos los desarrolladores y todos los entornos actualizan juntos.

---

## 12. INTELIGENCIA ARTIFICIAL Y USO DE HERRAMIENTAS ASISTIDAS

### 12.1 El Desarrollador es Responsable, No la IA

El código generado por IA (GitHub Copilot, Claude, ChatGPT, etc.) es una sugerencia, no una solución. El desarrollador que lo acepta e integra es **100% responsable** de ese código. Revisar el código generado con el mismo rigor que el escrito por otro humano.

### 12.2 Qué Delegar a la IA — Qué No

**Adecuado para asistencia IA:**
- Generación de boilerplate y scaffolding
- Transformaciones repetitivas de datos
- Generación de tests para código existente conocido
- Documentación de funciones y módulos
- Depuración de errores con contexto claro
- Exploración de APIs desconocidas

**Requiere revisión humana profunda:**
- Lógica de negocio crítica
- Código de seguridad y autenticación
- Migraciones de base de datos
- Algoritmos con implicaciones financieras
- Cualquier código que maneje datos personales

### 12.3 Prompting de Calidad

Un prompt de calidad incluye:
- Contexto del sistema y tecnologías usadas
- Restricciones y convenciones del proyecto
- El comportamiento esperado y casos borde relevantes
- Ejemplos de input/output cuando aplique

---

## CHECKLIST DE ENTREGA — ANTES DE CADA PR

```
CÓDIGO
[ ] ¿Las funciones tienen un único propósito claro?
[ ] ¿Están manejados todos los casos de error posibles?
[ ] ¿Hay algún secreto o dato sensible hardcodeado?
[ ] ¿El código nuevo respeta la arquitectura de capas existente?

PRUEBAS
[ ] ¿Se agregaron pruebas para la nueva funcionalidad?
[ ] ¿Se agregó prueba de regresión si se corrigió un bug?
[ ] ¿Todas las pruebas pasan localmente?
[ ] ¿La cobertura no disminuyó?

SEGURIDAD
[ ] ¿Se valida y sanitiza todo input externo?
[ ] ¿Los nuevos endpoints tienen autenticación/autorización?
[ ] ¿Se ejecutó el análisis de dependencias?

OPERACIONES
[ ] ¿Los nuevos flujos tienen logging adecuado?
[ ] ¿El cambio es reversible / tiene rollback definido?
[ ] ¿El README y/o documentación está actualizado?

COLABORACIÓN
[ ] ¿El PR es pequeño y enfocado (< 400 líneas idealmente)?
[ ] ¿La descripción del PR explica el contexto y cómo testear?
[ ] ¿Los commits siguen Conventional Commits?
```

---

## CIERRE

> *"Cualquier tonto puede escribir código que una computadora entiende. Los buenos programadores escriben código que los humanos pueden entender."*
> — **Martin Fowler**

> *"El software es como la entropía: difícil de atrapar, pesa casi nada y obedece la Segunda Ley de la Termodinámica; siempre aumenta."*
> — **Norman Augustine**

Estos lineamientos no son estáticos. Evolucionan con el equipo, las tecnologías y las lecciones aprendidas. Cualquier miembro del equipo puede proponer cambios mediante PR con justificación. Lo que no cambia es el compromiso con la excelencia, la responsabilidad y el respeto mutuo en el código que construimos juntos.

---

*Última actualización: Abril 2025 | Versión: 1.0.0*
