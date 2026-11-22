# Informe del Estado Actual del Proyecto: HIRAM Directory
**Fecha de generación:** 21 de noviembre de 2026  
**Entorno de ejecución:** Windows (cmd.exe) / Node.js v24.15.0  
**URL de Producción:** [https://hiram-directory.vercel.app](https://hiram-directory.vercel.app)  
**Repositorio GitHub:** `jesusgarcia17001-code/hiram-directory` (Rama `main`)

---

## 1. Versiones y Lista Completa de Dependencias

### Entorno Base
- **Node.js:** `v24.15.0`
- **Next.js:** `16.4.6` (App Router)
- **React:** `19.3.0`
- **React-DOM:** `19.3.0`
- **Tailwind CSS:** `4.3.3` (con `@tailwindcss/postcss` 4.3.5 y `@tailwindcss/turbopack` 4.3.3)
- **Supabase Client:** `@supabase/supabase-js` `2.119.2`, `@supabase/ssr` `0.12.7`
- **TypeScript:** `^5`

### Dependencias de Producción (`dependencies` en `package.json`)
- `@serwist/next`: `^9.5.15` (Integración PWA Service Worker con Next.js)
- `@supabase/ssr`: `^0.12.7` (Manejo de sesiones y cookies SSR para Supabase)
- `@supabase/supabase-js`: `^2.119.2` (Cliente PostgreSQL, Auth y Storage)
- `next`: `16.4.6` (Framework React fullstack)
- `react`: `19.3.0` (Librería UI)
- `react-dom`: `19.3.0` (Renderizado DOM)
- `server-only`: `^0.0.1` (Garantía de ejecución exclusiva en servidor)
- `serwist`: `^9.5.15` (Service Worker para soporte PWA offline)
- `zod`: `^4.6.7` (Validación de esquemas en servidor)

### Dependencias de Desarrollo (`devDependencies` en `package.json`)
- `@playwright/test`: `^1.65.1` (Pruebas End-to-End en navegadores reales)
- `@tailwindcss/postcss`: `^4.3.5` (Integración PostCSS para Tailwind v4)
- `@tailwindcss/turbopack`: `4.3.3` (Soporte Turbopack para Tailwind v4)
- `@testing-library/dom`: `^10.4.2`
- `@testing-library/jest-dom`: `^8.0.0`
- `@testing-library/react`: `^16.3.3`
- `@types/node`: `^24.19.2`
- `@types/react`: `^19`
- `@types/react-dom`: `^19`
- `@vitejs/plugin-react`: `^6.3.0`
- `eslint`: `^9`
- `eslint-config-next`: `16.4.6`
- `jsdom`: `^31.0.1` (Simulación de DOM para pruebas unitarias)
- `tailwindcss`: `4.3.3`
- `typescript`: `^5`
- `vitest`: `^5.1.1` (Runner de pruebas unitarias ultrarrápido)

---

## 2. Estructura de Carpetas Real (`src/` a 3 niveles)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── categorias/page.tsx
│   │   ├── pagos/page.tsx
│   │   ├── profesionales/page.tsx
│   │   └── ubicaciones/page.tsx
│   ├── panel/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── perfil/page.tsx
│   │   └── suscripcion/page.tsx
│   ├── [categoria]/
│   │   ├── page.tsx
│   │   └── [localidad]/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.ts
│   ├── page.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   └── sw.ts
├── components/
│   ├── admin/
│   │   ├── CategoriesManager.tsx
│   │   ├── CategoryModal.tsx
│   │   ├── CategoryStatusToggle.tsx
│   │   ├── LocationModal.tsx
│   │   ├── LocationStatusToggle.tsx
│   │   └── LocationsTree.tsx
│   ├── directory/
│   │   ├── Breadcrumbs.tsx
│   │   ├── ContactBox.tsx
│   │   ├── LocalityFilter.tsx
│   │   └── ProfessionalCard.tsx
│   ├── home/
│   │   ├── CategorySlider.tsx
│   │   ├── HeroIllustration.tsx
│   │   ├── HeroSearch.tsx
│   │   └── TrustFeatures.tsx
│   ├── layout/
│   │   ├── AdminNav.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── InstallPwaButton.tsx
│   │   ├── PanelNav.tsx
│   │   └── ServiceWorkerRegister.tsx
│   ├── payments/
│   │   └── ReceiptViewerModal.tsx
│   ├── professionals/
│   │   ├── ProfileGalleryManager.tsx
│   │   ├── ProfileLogoUploader.tsx
│   │   └── ProfileServicesManager.tsx
│   └── ui/
│       ├── Alert.tsx
│       ├── Button.tsx
│       └── Input.tsx
├── config/
│   ├── brand.ts
│   └── site.ts
├── features/
│   ├── admin/
│   │   ├── actions.ts
│   │   ├── categories/actions.ts
│   │   ├── components/ProfessionalStatusButtons.tsx
│   │   └── locations/actions.ts
│   ├── auth/
│   │   └── actions.ts
│   ├── metrics/
│   │   └── actions.ts
│   ├── payments/
│   │   ├── actions.ts
│   │   ├── AdminPaymentActions.tsx
│   │   └── PaymentForm.tsx
│   └── professionals/
│       ├── actions.ts
│       ├── media-actions.ts
│       └── components/ProfileForm.tsx
├── hooks/
│   └── (vacío: lógica organizada en features y servicios)
├── lib/
│   ├── storage-public.ts
│   ├── storage.ts
│   ├── supabase/
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   ├── server.ts
│   │   └── utils.ts
│   └── validations/
│       ├── auth.ts
│       ├── category.ts
│       ├── locations.ts
│       ├── media.ts
│       └── profile.ts
├── middleware.ts
├── services/
│   ├── categories.ts
│   ├── directory.ts
│   ├── locations.ts
│   ├── metrics.ts
│   └── payments.ts
└── types/
    └── database.ts
```

---

## 3. Todas las Rutas y Páginas del Proyecto

| Ruta | Tipo | Acceso permitido | Funcionalidad |
|---|---|---|---|
| `/` | Pública | Todos (Visitantes y usuarios) | Portada principal (Hero con buscador sin acentos, slider de categorías, 3 columnas de confianza, preguntas frecuentes y footer). |
| `/{categoria}` | Pública | Todos | Directorio SEO a nivel de estado (ej: `/plomeros`). Muestra profesionales aprobados de Anzoátegui, filtros y migas de pan. |
| `/{categoria}/{localidad}` | Pública | Todos | Directorio SEO local (ej: `/plomeros/puerto-la-cruz`). Muestra profesionales aprobados que atienden esa localidad específica. |
| `/{categoria}/{localidad}/{slug}` | Pública | Todos | Perfil público individual del profesional. Muestra logo, datos de negocio, especialidades, fotos de trabajos, zonas de cobertura y el `ContactBox` protegido. |
| `/login` | Pública | No autenticados (Visitantes) | Formulario de inicio de sesión con correo y contraseña. Redirige a `/panel` o `/admin` según rol. |
| `/register` | Pública | No autenticados (Visitantes) | Formulario de registro de cuenta y creación inicial del perfil profesional (con tipo persona/empresa y cédula/RIF). |
| `/panel` | Privada | Profesional autenticado (y Admin) | Vista principal del panel: muestra estado de aprobación, plan activo, contador de visitas/contactos acumulados y botón a suscripción. |
| `/panel/perfil` | Privada | Profesional autenticado | Edición completa de datos comerciales, teléfono/WhatsApp, logo/foto de perfil, galería de trabajos y catálogo de servicios ofrecidos. |
| `/panel/suscripcion` | Privada | Profesional autenticado | Visualización de planes vigentes, cuota consumida, formulario para reportar pago manual y subir comprobante. |
| `/admin` | Privada | Solo Administrador | Dashboard general administrativo: métricas de perfiles pendientes, aprobados, pagos por verificar y accesos directos. |
| `/admin/profesionales` | Privada | Solo Administrador | Listado de todos los profesionales registrados con filtros por estado. Permite aprobar, rechazar o suspender perfiles. |
| `/admin/pagos` | Privada | Solo Administrador | Bandeja de pagos reportados. Permite ver el comprobante con URL firmada y aprobar (activando suscripción) o rechazar el pago. |
| `/admin/categorias` | Privada | Solo Administrador | Gestión de categorías del directorio: crear nueva, editar datos/SEO, activar/desactivar y bloqueo de URL slug si tiene profesionales. |
| `/admin/ubicaciones` | Privada | Solo Administrador | Gestión jerárquica Estado > Municipio > Localidad: crear, editar, activar/desactivar con advertencia de impacto sobre profesionales. |
| `/sitemap.xml` | Pública | Motores de búsqueda / Todos | Mapa de sitio dinámico generado desde la base de datos con combinaciones activas (`listing_combinations`). |
| `/robots.txt` | Pública | Motores de búsqueda / Todos | Directivas de indexación: permite indexar directorios públicos y bloquea rutas privadas (`/panel`, `/admin`, `/login`, `/register`). |
| `/manifest.webmanifest` | Pública | Navegadores / PWA | Manifiesto de aplicación PWA con colores oficiales de marca, nombres e iconos instalables. |

---

## 4. Funciones que Existen Hoy (Por Área)

- **Registro y Login:**
  - Registro atómico de usuario (`auth.users`) y perfil (`users_profile` + `professionals` + `professional_contacts`).
  - Inicio de sesión seguro vía cookies HTTP-only gestionadas por `@supabase/ssr`.
  - Cierre de sesión y protección en middleware y Server Actions.
  - Rol de usuario (`professional` o `admin`) asignado en `users_profile`.
- **Perfil del Profesional:**
  - Edición de nombre comercial, descripción, años de experiencia, tipo de proveedor (Persona natural o Empresa), cédula o RIF, localidad base, zonas de servicio y horarios de atención.
  - Teléfonos de contacto (WhatsApp y llamada tradicional en formato E.164).
  - Estado de aprobación (`pending`, `approved`, `rejected`, `suspended`). Solo un admin puede aprobar perfiles.
- **Fotos:**
  - Foto de perfil / Logo (`professionals.logo_path`): disponible para todos los planes.
  - Galería de trabajos (`professional_photos`): subir, ordenar, pie de foto y borrar.
  - Límite dinámico de fotos comprobado en el servidor según el plan activo (`plans.features.max_photos`).
  - Almacenamiento en bucket público `professional-media` con conversión/compresión en ruta `{professional_id}/{uuid}.webp`.
  - Borrado automático en Storage al eliminar o sustituir fotos.
- **Servicios:**
  - Catálogo de servicios por categoría (`services`).
  - Asociación de servicios al perfil (`professional_services`): hasta 15 servicios por perfil con sugerencias automáticas o personalizados.
- **Directorio y SEO:**
  - Rutas dinámicas `/{categoria}`, `/{categoria}/{localidad}` y `/{categoria}/{localidad}/{slug}`.
  - Solo se listan y publican combinaciones con al menos un profesional aprobado (vista `listing_combinations`).
  - Metadatos dinámicos (`generateMetadata`), canonicals, Open Graph y datos estructurados JSON-LD (`ItemList` y `LocalBusiness`).
  - Teléfonos y datos de contacto ocultos del HTML inicial para proteger la cuota.
- **Buscador:**
  - Buscador en píldora en portada con sugerencias en tiempo real de categorías y servicios.
  - Normalización sin distinción de acentos ni mayúsculas (`normalize("NFD")`).
  - Selector de localidades activas y navegación por teclado (flechas, Enter, Escape).
- **Métricas y Cuota Gratuita:**
  - Cuota acumulada de 10 visitas o 5 contactos únicos para perfiles sin suscripción (límites configurados en `app_settings`).
  - Visita única registrada para siempre por visitante y perfil (`unique_visits`).
  - Contacto único: WhatsApp y llamada del mismo visitante cuentan como un solo contacto consumido (`unique_contacts`).
  - Contactos bajo suscripción activa **no** consumen cuota gratuita.
  - Bloqueo atómico con `reveal_professional_contact` (`SELECT ... FOR UPDATE`).
  - Identificación con `visitor_hash` (HMAC SHA-256 anónimo en cookie) sin almacenar direcciones IP.
  - Filtro automático de bots y rastreadores conocidos (`isBotRequest`).
- **Pagos y Suscripciones:**
  - Planes: Gratuito, Profesional ($5/mes ref.), Premium ($10/mes ref.) en tabla `plans`.
  - Registro de pago manual: selección de método (Pago Móvil, Transferencia, Efectivo), referencia, fecha y subida de comprobante al bucket privado `payment-receipts`.
  - La subida del comprobante **no** activa la suscripción: un administrador debe verificar y aprobar el pago.
  - Al aprobar, se crea/actualiza la suscripción con `ends_at = now() + duration_days`.
  - Verificación estricta de vencimiento: `ends_at > now()`, nunca fiarse solo de `status = 'active'`.
  - Generación de URLs firmadas temporales para visualización del comprobante en admin.
- **Panel Admin:**
  - `/admin/profesionales`: aprobar, rechazar o suspender perfiles con registro en `audit_logs`.
  - `/admin/pagos`: bandeja de pagos con comprobantes ampliables, aprobación y rechazo justificado.
  - `/admin/categorias`: listado, conteo de profesionales, creación con autogeneración de slug, edición y desactivación (nunca borrado). Bloqueo de slug si ya tiene profesionales.
  - `/admin/ubicaciones`: árbol de Estados > Municipios > Localidades, conteos, creación modal, advertencia antes de desactivar con profesionales asociados.
- **Notificaciones / Correos:**
  - NO EXISTE un servicio de correo electrónico o notificaciones push configurado.
- **PWA (Progressive Web App):**
  - Manifiesto web en `/manifest.webmanifest`.
  - Service Worker registrado en cliente vía `@serwist/next` con alcance `/` y archivo `public/sw.js`.
  - Botón suave de instalación condicional que responde al evento `beforeinstallprompt`.

---

## 5. Base de Datos (Migraciones y Estado Real)

### Migraciones en `supabase/migrations/`:
1. `20261118120000_initial_schema.sql` (Fase 0: Tablas base, roles, enums, RLS).
2. `20261118120100_seed_reference_data.sql` (Fase 0: Datos iniciales de categorías, municipios, localidades y planes).
3. `20261120100000_add_provider_type.sql` (Fase 2: Añadido `provider_type`, `id_type`, `id_number` en `professionals` y vista `professionals_public`).
4. `20261120130000_metrics_and_contact_reveal.sql` (Fase 4: Tablas de métricas, eventos, funciones `record_profile_visit` y `reveal_professional_contact`).
5. `20261120140000_fix_professionals_permissions.sql` (Fase 2: Políticas RLS de inserción/actualización de perfil).
6. `20261120150000_payments_and_subscriptions.sql` (Fase 5: Tablas `payments`, `payment_receipts`, `subscriptions`, bucket `payment-receipts` y función `admin_verify_payment`).
7. `20261120213000_audit_categories.sql` (Fase 7: Trigger de auditoría para cambios en categorías).
8. `20261120220000_audit_locations.sql` (Fase 7: Triggers de auditoría para cambios en ubicaciones).
9. `20261120223000_media_and_services.sql` (Fase 7: Tablas `professional_photos`, `professional_services`, `services`, campo `logo_path` y bucket `professional-media`).

**Estado de ejecución en Supabase:**
Todas las 9 migraciones anteriores fueron ejecutadas manualmente por el propietario en el Editor SQL de Supabase y sus objetos están activos.

### Tablas, Columnas y Funciones SQL añadidas después de la Fase 0:
- **En `professionals`:**
  - `provider_type` (`person` | `company`).
  - `id_type` (Cédula: `V`, `E` | RIF: `J`, `G`).
  - `id_number` (Número de documento).
  - `logo_path` (Ruta a la foto o logo en Storage).
- **Tablas nuevas creadas después de Fase 0:**
  - `payments`: Pagos reportados por profesionales.
  - `payment_receipts`: Referencia a comprobantes de pago en Storage.
  - `subscriptions`: Suscripciones activadas e historial.
  - `unique_visits`: Registro único de visitas por visitante/perfil.
  - `unique_contacts`: Registro único de contactos por visitante/perfil.
  - `visitor_events`: Registro detallado de eventos para analítica.
  - `services`: Catálogo de servicios por oficio.
  - `professional_services`: Servicios específicos asociados al profesional.
  - `professional_photos`: Galería de fotos con orden y pie de foto.
- **Funciones SQL añadidas:**
  - `record_profile_visit(p_professional_id, p_visitor_hash, p_dedupe_key)`
  - `reveal_professional_contact(p_professional_id, p_channel, p_visitor_hash, p_dedupe_key)`
  - `admin_verify_payment(p_payment_id, p_admin_id, p_action, p_rejection_reason)`
- **Buckets de Storage creados:**
  - `payment-receipts` (Privado, lectura solo admin y dueño con URLs firmadas).
  - `professional-media` (Público, lectura abierta, escritura solo el profesional en su carpeta).

---

## 6. Variables de Entorno

### Variables Públicas (Accesibles en el Navegador):
- `NEXT_PUBLIC_SUPABASE_URL` (URL del proyecto Supabase).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Clave anónima pública con políticas RLS).
- `NEXT_PUBLIC_SITE_URL` (URL base del sitio, ej. `http://localhost:3000` o dominio en Vercel).

### Variables Privadas (Solo Servidor):
- `SUPABASE_SERVICE_ROLE_KEY` (Clave con rol de servicio).
- `METRICS_HMAC_SECRET` (Clave secreta opcional para la firma HMAC de cookies de métricas).

*(Ningún valor secreto ha sido incluido en este informe).*

---

## 7. Uso de `service_role` en el Código

**Lista de archivos donde se usa:**
- ÚNICAMENTE en [src/lib/supabase/admin.ts](file:///c:/Users/JG/Desktop/web_serv/src/lib/supabase/admin.ts) mediante la función `createAdminClient()`.

**Razón y contexto:**
- Este archivo está protegido con `import "server-only";` para evitar cualquier fuga al cliente.
- **No se utiliza en Server Actions ni en páginas regulares:** Todas las acciones de administración (`/admin/*`), aprobación de profesionales, activación de pagos y edición de categorías/ubicaciones utilizan el cliente de sesión autenticada del usuario (`createClient()` de `@/lib/supabase/server`) y descansan en las políticas RLS y funciones con permisos `SECURITY DEFINER` de PostgreSQL.
- Se mantiene únicamente como utilidad reservada para tareas internas de mantenimiento o scripts que no cuenten con sesión de usuario.

---

## 8. Decisión en el Servidor de Contacto y Visitas

### Archivos involucrados:
1. [src/components/directory/ContactBox.tsx](file:///c:/Users/JG/Desktop/web_serv/src/components/directory/ContactBox.tsx) (Componente visual cliente que invoca la Server Action al hacer clic en WhatsApp o Llamar).
2. [src/features/metrics/actions.ts](file:///c:/Users/JG/Desktop/web_serv/src/features/metrics/actions.ts) (`revealContactAction`: Server Action que valida parámetros y maneja la respuesta).
3. [src/services/metrics.ts](file:///c:/Users/JG/Desktop/web_serv/src/services/metrics.ts) (`revealProfessionalContact`, `recordProfileVisit`, `getOrCreateVisitorHash`, `isBotRequest`).
4. Función SQL `reveal_professional_contact` en `supabase/migrations/20261120130000_metrics_and_contact_reveal.sql`.
5. Función SQL `record_profile_visit` en `supabase/migrations/20261120130000_metrics_and_contact_reveal.sql`.

### Cómo se decide y cuenta:
1. **Detección de Bots:** En el servidor se analiza el `User-Agent`. Si coincide con rastreadores conocidos, la solicitud se ignora y no consume cuota.
2. **Generación de `visitor_hash`:** Se lee una cookie HTTP-Only persistente (`__hiram_vid`). El servidor le aplica un HMAC SHA-256 usando `METRICS_HMAC_SECRET`. **Nunca se guarda la dirección IP**.
3. **Visitas:** Al abrir el perfil, `recordProfileVisit` ejecuta en Supabase `record_profile_visit`. Si el visitante no tenía un registro previo en `unique_visits` para ese profesional, se inserta la visita única (una por visitante y perfil para siempre).
4. **Contactos (Operación Atómica):** Al presionar WhatsApp o Llamada:
   - Se invoca la función SQL `reveal_professional_contact` que ejecuta un bloqueo de fila (`SELECT ... FOR UPDATE`) sobre el profesional.
   - Si el visitante es el dueño del perfil o un admin: se autoriza sin consumir cuota.
   - Si el profesional tiene suscripción activa (`ends_at > now()`): se autoriza sin consumir cuota gratuita.
   - Si no tiene suscripción activa: se evalúa si `visits < 10` y `contacts < 5` (valores leídos de `app_settings`).
   - Si no ha alcanzado los límites: se registra en `unique_contacts` (WhatsApp y llamada del mismo visitante cuentan como 1 solo contacto), se registra el evento en `visitor_events` y la base de datos retorna el teléfono.
   - Si alcanzó los límites: retorna `authorized: false`, `is_quota_exhausted: true` y no entrega el teléfono.
5. **Generación del Enlace:** Si la base de datos autorizó la entrega, `src/services/metrics.ts` construye la URL oficial en el servidor (`https://wa.me/+58...` o `tel:+58...`) y la envía al navegador para que abra el canal.

---

## 9. Pruebas Automatizadas y Resultado Real

### Resumen de Cobertura
- **Pruebas Unitarias:** 40 pruebas en 7 archivos (Vitest).
- **Pruebas End-to-End:** 16 pruebas en 5 archivos (Playwright con navegador Chromium real).

### Qué cubren:
- **Unitarias (`tests/unit/`):**
  - `brand.test.ts`: Integridad de tokens de marca, contraste y paleta de colores.
  - `validations.test.ts`: Esquemas Zod de registro, login y perfil profesional.
  - `categories.test.ts`: Validación Zod de categorías y reglas de slugs.
  - `locations.test.ts`: Validación Zod de estados, municipios y localidades.
  - `metrics.test.ts`: Generación de HMAC `visitor_hash`, detección de bots y deduplicación.
  - `payments.test.ts`: Esquema Zod de pagos y validación de tipos de comprobante.
  - `media-and-services.test.ts`: Formatos de imagen JPG/PNG/WebP, límites de tamaño y URL públicas de Storage.
- **End-to-End (`tests/e2e/`):**
  - `home.spec.ts`: Carga de portada, titular de dos líneas, buscador en píldora con autocompletado sin acentos, navegación a listado y adaptación móvil a 360 px.
  - `auth-and-profile.spec.ts`: Redirección y protección de `/panel`, `/panel/perfil` y `/admin` para usuarios no autenticados; campos requeridos de login y registro.
  - `categories.spec.ts`: Protección de acceso a `/admin/categorias`.
  - `locations.spec.ts`: Protección de acceso a `/admin/ubicaciones`.
  - `payments.spec.ts`: Protección de acceso a `/panel/suscripcion` y `/admin/pagos`.
  - `seo.spec.ts`: Generación válida de `robots.txt`, `sitemap.xml` dinámico y páginas de categorías.

### Ejecución Real (Comprobada hoy):
- **Resultado `npm test`:**
  ```
  Test Files  7 passed (7)
       Tests  40 passed (40)
    Duration  15.83s
  ```
- **Resultado `npx playwright test`:**
  ```
  Running 16 tests using 2 workers
    16 passed (36.4s)
  ```

---

## 10. Diferencias con CLAUDE.md

1. **Estructura de hooks (`src/hooks`):**
   - En CLAUDE.md se menciona una carpeta `src/hooks/`. La carpeta física existe pero está vacía porque la lógica reactiva se ubicó directamente dentro de los módulos de dominio en `src/features/` o como hooks de React dentro de componentes para mayor cohesión.
2. **Convención de Middleware de Next.js:**
   - Next.js 16 introdujo una advertencia informativa recomendando migrar de `middleware.ts` a `proxy`. El proyecto mantiene `middleware.ts` tal como lo especifica CLAUDE.md para compatibilidad estándar.
3. **Planes y límites:**
   - Cumplimiento 100% fiel: los límites (10 visitas y 5 contactos) están en `app_settings` y el límite de fotos se lee directamente de `plans.features.max_photos`.

---

## 11. Cosas Añadidas que No Estaban en la Especificación Inicial

1. **Gestión Administrativa de Categorías (`/admin/categorias`):** Pantalla para crear, editar, ordenar y activar/desactivar categorías con bloqueo de slug para categorías con profesionales.
2. **Gestión Administrativa de Ubicaciones (`/admin/ubicaciones`):** Árbol de Estados > Municipios > Localidades con conteo en vivo de profesionales aprobados y advertencia de impacto antes de desactivar.
3. **Tipo de Proveedor y Documento de Identidad:** Soporte explícito para diferenciar entre "Persona natural" y "Empresa", solicitando Cédula (V/E) o RIF (J/G) en registro y panel.
4. **Galería de Trabajos y Logo en Perfil:** Subida y ordenamiento de fotos de trabajos y logo para todos los planes con validación en servidor y compresión WebP.
5. **Catálogo de Servicios Sugeridos:** Tabla `services` que permite sugerir servicios específicos según el oficio del profesional (hasta 15 servicios).
6. **Tokens Semánticos de Marca (Fase 8, Paso 0):** Paleta oficial `#0B2A5B` (primary), `#F97316` (accent), `#EAF0FA` (surfaceSoft) con contraste accesible WCAG AA verificado.
7. **Buscador Insensible a Acentos y Diacríticos:** Búsqueda que normaliza texto para encontrar especialidades sin requerir acentos exactos.
8. **Botón de Instalación PWA:** Botón suave en cabecera que se activa automáticamente solo si el navegador soporta el evento `beforeinstallprompt`.

---

## 12. Problemas Conocidos, Errores Pendientes y Deuda Técnica

1. **Notificaciones y Correo Electrónico:** NO EXISTEN. Cuando un profesional se registra, no recibe correo de bienvenida. Cuando un admin aprueba un perfil o un pago, el cambio se refleja en la base de datos pero no se envía correo al usuario.
2. **Pasarelas de Pago Automatizadas:** NO EXISTEN. Todo el flujo de suscripciones es manual (reporte de transferencia/Pago Móvil y verificación humana).
3. **Redes Sociales del Profesional:** El perfil no cuenta con campos para enlazar Instagram, Facebook o sitio web propio (solo WhatsApp y teléfono).
4. **Deprecación de `middleware.ts` en Next.js:** Durante el build se muestra una advertencia de Next.js sugiriendo migrar a `proxy` en versiones futuras.
5. **Reseñas o Valoraciones:** NO EXISTEN (según la regla de CLAUDE.md de no inventar valoraciones falsas en etapas iniciales).

---

## 13. Despliegue y Vercel

- **URL del Proyecto en Vercel:** [https://hiram-directory.vercel.app](https://hiram-directory.vercel.app)
- **Rama desplegada:** `main` (despliegue continuo activado con cada push).
- **Variables configuradas en Vercel:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`

---

## 14. Lo que Falta de la Especificación Original

1. **Fase 6 (Pulido final SEO, auditoría de rendimiento y lanzamiento):**
   - Pruebas de Lighthouse / Core Web Vitals en producción.
   - Ajuste fino de textos y descripciones para todas las categorías del estado.
2. **Sistema de Email Transaccional (Recomendado para post-lanzamiento):**
   - Integración con Resend o servicio SMTP para avisos de "Perfil aprobado", "Pago recibido" y "Recordatorio de suscripción próxima a vencer".
3. **Integración futura de pasarelas de pago automatizadas:**
   - Pasarelas para cobro automático de suscripciones en bolívares o divisas.
