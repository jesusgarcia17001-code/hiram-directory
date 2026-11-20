# CLAUDE.md — Reglas permanentes del proyecto HIRAM Directory

Nombre interno provisional: **HIRAM Directory**. El nombre comercial definitivo está pendiente.
Todo lo relacionado con marca (nombre, logo, colores, tipografías, eslogan) vive SOLO en
`src/config/brand.ts` y en variables CSS. Nunca escribir el nombre de marca a mano en componentes.
No usar ManoCerca, TECNIRED ni ningún otro nombre como identidad definitiva.

## 1. Qué es
Directorio web de técnicos y prestadores de servicios en Anzoátegui, Venezuela (inicio: Puerto La Cruz
y Barcelona), con modelo freemium → suscripción. HIRAM es propietario y administrador central.
Debe poder expandirse a otros estados (estado > municipio > localidad).

## 2. Stack obligatorio (no sustituir sin explicar antes por qué)
Next.js (App Router) · React · TypeScript **estricto** · Tailwind CSS · Supabase (Auth, PostgreSQL,
Storage, RLS) · Vercel · PWA.
Añadidos aprobados: Zod (validación), Serwist (service worker PWA), Vitest y Playwright (pruebas).

## 3. Cómo trabajar con el propietario (Jesús)
- Es principiante: explicar cada paso, sin dar por hecho comandos ni conceptos.
- Para cada comando: dónde ejecutarlo, qué programa abrir, comando completo, qué resultado esperar y
  cómo comprobar que funcionó.
- Usa **Windows + cmd** (no PowerShell ni bash). Evitar comandos multilínea con paréntesis; preferir
  un comando por línea.
- Entregar archivos **completos** con su ruta completa; no fragmentos para pegar a mano.
- No eliminar funcionalidades existentes al agregar nuevas.
- Nunca afirmar que algo funciona sin haberlo comprobado. Decir qué se probó y qué no.
- Trabajar por fases. Al terminar cada una: qué se hizo, archivos creados/modificados, cómo probarlo,
  errores pendientes. Pedir confirmación antes de la siguiente si hay decisiones funcionales abiertas.
- Cualquier configuración en Supabase, GitHub o Vercel se explica paso a paso.

## 4. Reglas de negocio (fuente de verdad)
**Cuota gratuita por perfil — acumulada desde la creación, NUNCA se reinicia:**
- 10 visitas únicas **o** 5 contactos únicos; se aplica el límite que se alcance primero.
- Visita única = una por visitante y perfil, **para siempre**.
- Contacto único = una por visitante y perfil; WhatsApp y llamada del mismo visitante cuentan **como uno**.
  (Cada clic se guarda igual como evento para estadísticas.)
- Los contactos hechos durante un período de suscripción activa **no** consumen la cuota gratuita.
- Los límites (10 y 5) están en la tabla `app_settings`, no en el código.
- Impresión (aparece en resultados) ≠ visita (abre el perfil). No mezclar.
- Se excluyen: dueño del perfil, administradores, bots conocidos, reintentos de red (`dedupe_key`).
- Al alcanzar un límite sin suscripción activa: el perfil sigue visible, se ocultan WhatsApp/llamada,
  aviso de restricción, el profesional ve sus estadísticas y se le invita a contratar un plan.
- Suscripción vencida ⇒ contactos bloqueados otra vez. **Siempre** comprobar `ends_at > now()`;
  nunca confiar solo en `status = 'active'`.
- Visitas y contactos son indicadores de interés, no garantías de clientes.

**Pagos manuales:** el profesional registra pago + comprobante → aparece en admin → un administrador
verifica y aprueba/rechaza → recién ahí se activa la suscripción. Subir una imagen NO activa nada.
Todo queda en `audit_logs`. Preparar la arquitectura para pasarelas de pago futuras.

**Planes:** Gratuito, Profesional (ref. USD 5/mes), Premium (ref. USD 10/mes). Precios y beneficios
son hipótesis editables desde admin sin tocar código (`plans.features`).

**Cobertura:** no mostrar cobertura en una localidad si no hay profesionales que la atiendan
(vista `listing_combinations`). Localidades se activan por etapas.

## 5. Seguridad (obligatoria)
- RLS activo en TODAS las tablas con datos de usuarios. Permisos cerrados por defecto: `revoke` + `grant`
  explícito por tabla/columna.
- `service_role` **jamás** en el navegador ni en variables `NEXT_PUBLIC_*`. Solo en módulos marcados con
  `import "server-only"`. Preferir el cliente con sesión del usuario + funciones SQL que verifican permisos.
- Un profesional NO puede cambiar su rol, estado de aprobación, suscripción ni pagos. Solo un admin
  aprueba perfiles (`admin_set_professional_status`) y verifica pagos.
- El público lee `professionals_public` (vista) — nunca la tabla `professionals` ni `professional_contacts`.
- El frontend nunca decide si un contacto está autorizado: lo decide una función del servidor que
  comprueba límite, registra el evento y recién entonces entrega el teléfono. Operación atómica
  (bloqueo de fila) para evitar condiciones de carrera.
- Visitas, contactos, contadores y `visitor_hash` los genera/escribe solo el servidor (HMAC con secreto
  del servidor; no guardar IP). Nunca confiar en contadores enviados por el navegador.
- Validar en el servidor TODO dato importante (Zod + restricciones en base de datos como respaldo).
- Archivos: validar tipo y tamaño en el servidor; comprobantes en bucket **privado** con URLs firmadas.
- Rutas `/panel` y `/admin` protegidas en el servidor (middleware + comprobación en cada acción).
  Las restricciones visuales del frontend nunca son la única defensa.
- Anti-spam en formularios públicos y reportes (límite de frecuencia).
- Registrar acciones administrativas en `audit_logs`.
- Teléfonos en formato E.164 (+58...). El enlace de WhatsApp/llamada se arma en el servidor.

## 6. SEO (prioridad comercial)
Las páginas de **lista** por categoría y localidad son la puerta de entrada principal; desde ahí se
entra a los perfiles.
- `/{categoria}` ej. `/plomeros` → lista de Anzoátegui.
- `/{categoria}/{localidad}` ej. `/plomeros/puerto-la-cruz` → lista local.
- `/{categoria}/{localidad}/{slug-profesional}` → perfil individual.
- Los slugs de categoría vienen de `categories.listing_slug`; los de localidad de `localities.slug`.
- Renderizado en servidor (Server Components / ISR), `generateMetadata` por página, canonical,
  datos estructurados JSON-LD (ItemList en listas; LocalBusiness/Service en perfiles; sin reseñas ni
  valoraciones inventadas), `sitemap.xml` y `robots.txt` generados desde la base.
- Solo se publican y listan en el sitemap combinaciones con al menos un profesional aprobado.
- Cada lista enlaza a sus perfiles y cada perfil enlaza de vuelta a su lista.
- Teléfonos y datos de contacto protegidos NUNCA van en el HTML inicial.
- `noindex` y fuera del sitemap: `/panel`, `/admin`, `/api`, login/registro, resultados de búsqueda internos.
- Imágenes optimizadas (`next/image`), textos únicos por página. No prometer posiciones en Google.

## 7. Arquitectura y estructura de carpetas
La lógica de negocio va separada de los componentes visuales.
```
src/
  app/            rutas (públicas, (auth), panel/, admin/, api/)
  components/     ui/ (botones, tarjetas…) y layout/
  features/       profesionales, metricas, suscripciones, pagos, admin (UI + hooks del dominio)
  services/       reglas de negocio y acceso a datos (sin JSX)
  lib/            supabase/ (cliente navegador, servidor, admin), validaciones Zod, utilidades
  config/         brand.ts, site.ts
  hooks/          types/
supabase/
  migrations/     SQL versionado (nunca editar una migración ya aplicada; crear una nueva)
  tests/          pruebas de seguridad SQL
public/           manifest, iconos PWA
tests/            unitarias (Vitest) y e2e (Playwright)
```

## 8. Base de datos
- Cambios solo mediante migraciones nuevas en `supabase/migrations/` (nombre con fecha/hora).
- UUID, claves foráneas, índices y restricciones CHECK apropiadas.
- Después de cualquier migración: ejecutar `supabase/tests/security_checks.sql`.
- Contadores calculados desde eventos válidos o mantenidos por operaciones transaccionales.

## 9. Pruebas requeridas
Registro · inicio de sesión · creación de perfil · aprobación admin · visibilidad pública · protección
de contactos · conteo de visitas · conteo de contactos · bloqueo al alcanzar límites · activación manual
de suscripción · vencimiento · permisos de administrador. No usar datos ficticios en producción.

## 10. Fases
F0 SQL corregido + CLAUDE.md · F1 proyecto base, Supabase, diseño, PWA, brand.ts · F2 registro, login,
perfil del profesional · F3 admin de aprobación + directorio público/SEO · F4 métricas, límites,
bloqueo · F5 pagos manuales y suscripciones · F6 pulido SEO, pruebas, despliegue.
No avanzar de fase sin aprobación del propietario.
