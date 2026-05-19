# Plan Maestro — Feed XML para Google Merchant

> **Estado:** Implementado — pendiente de validación con datos reales y de configurar `SITE_URL` y `FEED_REGENERATE_SECRET` en Netlify.
> **Cliente:** Dumitru (CEO MidCar)
> **Estimación:** 5 días de trabajo
> **Precio acordado:** 250 € (pago único)
> **Última actualización:** 2026-05-19

---

## 1. Objetivo

Generar y publicar un feed XML (RSS 2.0 con namespace de Google) con el catálogo completo de vehículos del CRM, alojado en una URL estable, actualizado diariamente y conectable a Google Merchant Center por el equipo de SEO de MidCar.

**Entregables:**
1. Endpoint público que sirve el XML válido (cacheado, accesible sin auth).
2. Refresco automático diario + botón de refresco manual desde el CRM.
3. Sección de configuración en el CRM con la URL fija, timestamp de última generación y nº de items.
4. Modo "test" con 2 vehículos para la validación inicial de Google.
5. Toggle por vehículo "Incluir en feed Google" (opt-out granular).

---

## 2. Especificación técnica del feed (exigida por Google Merchant)

| Atributo | Valor |
|---|---|
| Formato | RSS 2.0 |
| Namespace | `xmlns:g="http://base.google.com/ns/1.0"` |
| Codificación | UTF-8 **sin BOM** |
| `Content-Type` HTTP | `application/xml; charset=utf-8` |
| Moneda | `EUR` |
| Idioma del contenido | `es-ES` |
| Escapado | Sólo entidades XML básicas (`&amp; &lt; &gt; &quot; &apos;`). Sin HTML dentro de los nodos. |
| Línea por item | Texto plano, sin saltos extraños. |

### 2.1 Estructura mínima del XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MidCar — Catálogo de Vehículos de Ocasión</title>
    <link>https://midcar.es</link>
    <description>Feed de inventario de MidCar para Google Merchant</description>
    <item>...</item>
  </channel>
</rss>
```

### 2.2 Campos por `<item>`

| Tag | Origen en BBDD (`vehicles`) | Notas / fallback |
|---|---|---|
| `g:id` | `stock_id` | ID único estable. Único requisito: que no cambie entre refrescos. |
| `title` | `"{marca} {modelo} {año_matriculacion} {version}"` | Truncar a 150 chars. Sin HTML. |
| `description` | `descripcion` si existe; si no, autogenerar (ver §3.2). | 500 – 5.000 chars recomendado. Texto plano. |
| `link` | `url_web` si existe; si no, `${SITE_URL}/coches/${slug}` | Tiene que devolver 200 y mostrar el coche. |
| `g:image_link` | `imagen_principal` | URL pública absoluta (HTTPS). |
| `g:additional_image_link` (xN) | `imagenes[].url` (máx 10) | Excluir la principal para no duplicar. |
| `g:brand` | `marca` | |
| `g:mpn` | `stock_id` o `vin` si está presente | Recomendado VIN si está, MPN si no. |
| `g:condition` | constante `used` | Todos los coches del inventario son de ocasión. |
| `g:availability` | `in_stock` si `estado='disponible'`; `out_of_stock` si `'reservado'`; excluir si `vendido`, `taller`, `baja`. | Ver §3.3. |
| `g:price` | `(precio_venta - descuento).toFixed(2) + " EUR"` | Si `descuento` > 0, usar también `g:sale_price`. |
| `g:sale_price` *(opcional)* | precio efectivo cuando hay descuento | Ver §3.4. |
| `g:google_product_category` | constante `"Vehicles & Parts > Vehicles > Motor Vehicles > Cars, Trucks & Vans"` | Categoría de Google. |
| `g:product_type` | `"Vehículos > Coches de ocasión > {marca}"` | Categoría interna. |
| `g:identifier_exists` | `no` | Los coches usados no tienen GTIN; declaramos que no existe identificador. |

> **Decisión a confirmar con Dumitru/SEO:** Google Merchant tiene una vertical específica de **"Vehicle ads"** con campos extra (`g:vehicle_year`, `g:vehicle_mileage`, `g:vehicle_color`, `g:vehicle_fuel_type`, etc.). El brief inicial sólo pidió el feed de catálogo genérico (Shopping). Empezamos con el feed genérico tal como pidió el CEO; si SEO quiere Vehicle Ads, se añade en una segunda iteración (no incluido en los 250 €).

---

## 3. Reglas de negocio y mapeo

### 3.1 Filtrado de vehículos incluidos

Un vehículo entra al feed sólo si **todas** se cumplen:
- `estado IN ('disponible', 'reservado')` — excluimos `vendido`, `taller`, `baja`.
- `precio_venta > 0`.
- `imagen_principal` no nulo y URL válida.
- `marca` y `modelo` no nulos.
- Nuevo flag `incluir_en_feed = true` (default `true`).

### 3.2 Descripción autogenerada (fallback)

Cuando `descripcion` está vacía, generar a partir de los campos disponibles, en este orden:

```
{marca} {modelo} {version} del año {año_matriculacion}.
Motor {tipo_motor} {cilindrada}cc {potencia_cv}CV, combustible {combustible}, cambio {transmision}.
{kilometraje} km. {num_propietarios} propietario(s). Etiqueta DGT {etiqueta_dgt}.
Garantía de {garantia_meses} meses. Vehículo disponible en MidCar.
```

Saltar líneas o campos `null`/`0` con elegancia. Resultado de 200–400 caracteres típico.

### 3.3 Disponibilidad

- `disponible` → `in_stock`
- `reservado` → `out_of_stock` (Google permite mostrarlo como reservado/no disponible)
- `vendido` / `taller` / `baja` → excluir del feed por completo

### 3.4 Precio con descuento

```
precio_efectivo = precio_venta - (descuento || 0)
```

- Siempre `g:price` con `precio_venta` original.
- Si `descuento > 0`: añadir `g:sale_price` con `precio_efectivo`.
- Formato: dos decimales + " EUR" — ej: `15990.00 EUR`.

### 3.5 URL del vehículo (`<link>`)

Prioridad:
1. `url_web` si está poblado (lo edita el CRM).
2. `${SITE_URL}/coches/${slug}` donde slug = `${marca}-${modelo}-${año}-${stock_id}` en kebab-case, sin tildes.

**Riesgo:** la web pública de MidCar es un proyecto separado. Hay que confirmar con SEO que esas URLs existen y devuelven 200. Si no, **bloqueante** para Google.

### 3.6 Imágenes

- Todas las URLs deben ser HTTPS, públicas, accesibles sin auth.
- Las del bucket `web-images` de Supabase ya cumplen.
- Máximo 10 `g:additional_image_link` por item (límite de Google).
- Filtrar URLs rotas no se hace en build de feed (sería lento). Confiamos en que el bucket público responde; si Google reporta 404s, los marcamos en una segunda iteración.

### 3.7 Saneado de texto

- Strip de etiquetas HTML en `descripcion` (algunos vehículos pueden traer HTML del scraper).
- Reemplazar `\n` por espacio o usar `<![CDATA[]]>` para descripciones multi-línea.
- Escapar `&`, `<`, `>` antes de inyectar (o envolver siempre en CDATA — más simple, menos propenso a fallar).

---

## 4. Arquitectura técnica

### 4.1 Ruta y entrega

- **URL pública:** `https://{dominio}/api/feeds/merchant.xml`
- **Rewrite limpio (opcional, Netlify):** `/feeds/merchant.xml` → `/api/feeds/merchant.xml`
- **Implementación:** App Router — `src/app/api/feeds/merchant.xml/route.ts` con `GET` que devuelve `new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } })`.

### 4.2 Estrategia de cacheado y refresco diario

Tres opciones evaluadas:

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| ISR Next.js (`revalidate: 86400`) | Cero infraestructura, simple | El refresco ocurre con la primera petición tras expirar, no a hora fija | ❌ |
| Servir desde Next + `Cache-Control` para CDN de Netlify + cron que llama a `revalidatePath` | Una sola fuente de verdad, cero archivos intermedios, sin coste extra | El primer hit tras invalidar paga 1 query a Supabase | ✅ **elegido** (simplificado tras evaluar) |
| Pre-calcular XML y subirlo a Supabase Storage | CDN puro, sin compute | Más piezas, riesgo de desync entre BBDD y Storage | ❌ Sobre-ingeniería para ~10 polls/día de Google |

**Flujo definitivo implementado:**
1. `GET /api/feeds/merchant.xml` lee vehículos elegibles de Supabase y serializa el XML en memoria.
2. Devuelve el XML con `Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600` → el CDN de Netlify lo cachea 24h.
3. La scheduled function de Netlify (`netlify/functions/regenerate-feed.ts`, schedule `0 2 * * *` UTC ≈ 03:00 Madrid) llama a `POST /api/feeds/merchant/regenerate` con `Authorization: Bearer ${FEED_REGENERATE_SECRET}`.
4. Ese POST:
   - Vuelve a construir el XML (para validar que la query funciona).
   - Llama a `revalidatePath('/api/feeds/merchant.xml')` para invalidar el cache del CDN.
   - Hace `upsert` en `feed_metadata` con `status='ok'`, `item_count`, `triggered_by`.
5. Desde la UI de Configuración → "Feed Google Merchant" hay un botón que llama al mismo POST con el JWT de la sesión del CRM (vía `Authorization: Bearer ${session.access_token}`), permitiendo al usuario forzar la actualización.
6. Ante cualquier fallo, el endpoint público devuelve un XML vacío válido (200 OK) en vez de un 500 para que Google no marque el feed como caído.

> **Por qué se simplificó frente al borrador inicial:** Storage añade un punto de fallo más (desync entre BBDD y archivo subido) sin ganancia real para el patrón de consumo de Google (1–4 fetches/día). Servir desde Next con cache HTTP es igual de rápido vía CDN y mantiene una única fuente de verdad.

### 4.3 Refresco manual desde el CRM

- Botón "Regenerar feed ahora" en `Configuración → Integraciones → Google Merchant`.
- Llama a `POST /api/feeds/merchant/regenerate` con la cookie de sesión (auth normal del CRM).
- Muestra spinner, luego "Feed regenerado a las HH:MM con N vehículos".

### 4.4 Test inicial con 2 vehículos

- Query string `?test=true` en el endpoint **público**: devuelve sólo los 2 primeros vehículos elegibles (orden: `created_at desc`).
- URL para enviar a Google en la validación inicial: `https://{dominio}/api/feeds/merchant.xml?test=true`.
- Sin caché para el modo test (`Cache-Control: no-store`) para iterar rápido.

---

## 5. Cambios en BBDD

Una sola migración nueva: `014_add_feed_support.sql`.

```sql
-- Flag por vehículo para excluir del feed
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS incluir_en_feed BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_vehicles_feed ON public.vehicles(incluir_en_feed) WHERE incluir_en_feed = true;

-- Metadatos del último feed generado
CREATE TABLE IF NOT EXISTS public.feed_metadata (
  id TEXT PRIMARY KEY,             -- 'merchant'
  last_generated_at TIMESTAMPTZ,
  item_count INTEGER,
  status TEXT,                     -- 'ok' | 'error'
  error_message TEXT,
  triggered_by TEXT,               -- 'cron' | 'manual:<user_id>'
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Cambios en el CRM (UI)

### 6.1 Configuración → nueva sección "Google Merchant"

- URL del feed (read-only, con botón "Copiar").
- Última generación: timestamp + nº items.
- Botón "Regenerar ahora".
- Switch "Activar generación automática diaria" (default ON).
- Indicador de estado (verde/rojo) según último intento.

### 6.2 Ficha de vehículo

- Sección "Publicación": switch "Incluir en feed Google Merchant" (default ON).
- Aviso si el vehículo no cumple requisitos mínimos (sin foto, sin precio, etc.): "Este vehículo no aparecerá en el feed porque falta: imagen principal."

### 6.3 Inventario (lista)

- Columna opcional / icono pequeño "En feed Google" — visible al hover, no abarrota.

---

## 7. Variables de entorno nuevas

Añadidas en `.env.example`:

```bash
# Dominio público (sin slash final) — usado para construir links canónicos en el feed.
SITE_URL=https://midcar.es

# Token compartido entre la scheduled function de Netlify y el endpoint POST de regeneración.
# Genéralo con: openssl rand -hex 32
FEED_REGENERATE_SECRET=<32-bytes-random>
```

Hay que configurarlas en Netlify (Site settings → Environment variables) antes de que el cron funcione.

---

## 8. Plan de ejecución (5 días)

### Día 1 — Backend del feed
- [ ] Migración `014_add_feed_support.sql`.
- [ ] Service `src/lib/feed-service.ts` con `buildMerchantFeed()`: query a Supabase + serialización XML.
- [ ] Tests unitarios (Jest) del serializador: escapado, items vacíos, sale_price, fallback de description.
- [ ] Endpoint `GET /api/feeds/merchant.xml` que sirve el XML al vuelo (sin Storage todavía).

### Día 2 — Cacheado y Storage
- [ ] Endpoint `POST /api/feeds/merchant/regenerate` (auth con secret + auth de sesión).
- [ ] Subida del XML al bucket `web-public/feeds/merchant.xml`.
- [ ] Update de `feed_metadata`.
- [ ] Modo `?test=true` para 2 vehículos.

### Día 3 — Cron y refresco automático
- [ ] Scheduled function de Netlify (`netlify/functions/regenerate-feed.ts`) — schedule cron `0 3 * * *`.
- [ ] Configuración de `netlify.toml` (crearlo si no existe).
- [ ] Logs y manejo de error (si falla, mantener XML anterior + notificación).

### Día 4 — UI en CRM
- [ ] Sección "Google Merchant" en Configuración.
- [ ] Switch `incluir_en_feed` en ficha de vehículo.
- [ ] Botón regenerar manual con feedback.

### Día 5 — Validación y test con Google
- [ ] Subir el XML de 2 vehículos al validador de Google Merchant.
- [ ] Iterar sobre los errores que reporte Google (típicamente: descripción corta, imágenes 404, precio mal formateado).
- [ ] Activar generación completa (todo el stock).
- [ ] Pasar URL final al equipo SEO de MidCar.
- [ ] Documentar en `WALKTHROUGH.md` (sección nueva "Feed Google Merchant").

---

## 9. Checklist de validación pre-Google

Antes de pasarle la URL al equipo SEO, validar manualmente:

- [ ] El XML abre en navegador sin errores de parsing.
- [ ] Validador online (https://validator.w3.org/feed/) reporta válido (warnings de Google namespace son aceptables).
- [ ] `Content-Type` es `application/xml; charset=utf-8`.
- [ ] Encoding UTF-8 sin BOM (verificar con `xxd merchant.xml | head -1`).
- [ ] Todos los `<link>` devuelven 200 (muestreo de 5 items).
- [ ] Todas las `g:image_link` devuelven 200 con `Content-Type: image/*`.
- [ ] Precios con formato `XXXXX.XX EUR`.
- [ ] No hay tags HTML dentro de los nodos.
- [ ] El feed tiene al menos un item.
- [ ] El feed se sirve por HTTPS con cert válido.

---

## 10. Riesgos y bloqueantes

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | La web pública de MidCar no tiene URL canónica por vehículo (`/coches/{slug}`) | Bloqueante — Google rechaza si el link no muestra el producto | Confirmar con SEO en día 1. Si no existe, usar `url_web` manual o bloquear hasta que esté lista. |
| R2 | Algunos vehículos no tienen `descripcion` y la autogenerada no es lo bastante rica | Medio — Google avisa de descripción corta | Fallback algorítmico (§3.2) + recomendar al CEO completar descripciones para los Top 20. |
| R3 | Imágenes con URL no-HTTPS o privadas | Medio — Google las rechaza | Auditar bucket en día 2; el bucket `web-images` ya es público y HTTPS. |
| R4 | Sin `vin` ni GTIN, Google puede penalizar relevancia | Bajo | Declarar `g:identifier_exists=no` como solución oficial de Google para vehículos. |
| R5 | El cron de Netlify falla silenciosamente | Bajo | Tabla `feed_metadata` muestra última generación; alert si > 26h sin regenerar (futura iteración). |
| R6 | Categorización "Cars" en Shopping vs feed de "Vehicle Ads" dedicado | Medio — afecta visibilidad | Empezar con Shopping genérico como pidió el CEO; segunda fase si SEO lo pide. |

---

## 11. Lo que **NO** está incluido en los 250 €

Para evitar scope creep — clarificar a Dumitru antes de empezar:

- ❌ Conectar el feed con Google Merchant Center (lo hace el equipo SEO).
- ❌ Configurar campañas de Google Shopping / Performance Max.
- ❌ Migrar al formato "Vehicle Ads" si se requiere en el futuro.
- ❌ Multi-feed por país/idioma.
- ❌ Sistema de alertas por email cuando falla la regeneración.
- ❌ Dashboard de métricas del feed (clicks, impresiones — eso vive en Merchant Center).

---

## 12. Preguntas abiertas (responder antes de día 1)

1. **¿Cuál es el dominio público definitivo?** ¿`midcar.es`? ¿`midcarautomocion.com`? — Necesario para `SITE_URL` y URLs canónicas.
2. **¿La web pública tiene página por vehículo?** Si no, hay que decidir si:
   - (a) Se pospone hasta que la tengan.
   - (b) Usamos la URL del CRM (no recomendable, está tras login).
   - (c) Generamos páginas mínimas en el propio Next del CRM bajo `/coches/[slug]` (suma trabajo, no entra en 250 €).
3. **¿Confirmar moneda EUR y locale `es-ES`?** (Asumido sí).
4. **¿Confirmar que `stock_id` es estable en el tiempo y único?** Para usarlo como `g:id`.
5. **¿Logo / nombre comercial exacto para el `<title>` del channel?** Asumido "MidCar — Catálogo de Vehículos de Ocasión".

---

## 13. Estructura de archivos final (implementada)

```
src/
├── app/api/feeds/
│   ├── merchant.xml/route.ts            # GET público con CDN cache
│   └── merchant/regenerate/route.ts     # POST autenticado (cron + sesión CRM)
├── app/(dashboard)/configuracion/
│   ├── page.tsx                         # + botón "Feed Google Merchant"
│   └── google-merchant/page.tsx         # nueva sub-página de configuración
├── app/(dashboard)/inventario/[id]/
│   └── VehicleDetailClient.tsx          # + card "Publicar en Google Merchant"
├── lib/
│   ├── feed-service.ts                  # buildMerchantFeed() + helpers puros
│   └── supabase-service.ts              # +incluir_en_feed en transformadores
├── lib/__tests__/
│   └── feed-service.test.ts             # 46 tests (escaping, fallbacks, items)
├── types/index.ts                       # +incluir_en_feed en Vehicle
netlify/
└── functions/regenerate-feed.ts         # Scheduled function diaria (cron 02:00 UTC)
netlify.toml                              # build + schedule + redirect /feeds/*
supabase/migrations/
└── 014_add_feed_support.sql             # incluir_en_feed + tabla feed_metadata
.env.example                              # + SITE_URL + FEED_REGENERATE_SECRET
```

---

## 14. Despliegue y siguientes pasos

1. Ejecutar la migración 014 en Supabase (SQL Editor).
2. Configurar en Netlify estas dos vars:
   - `SITE_URL` → dominio público definitivo (ej. `https://midcar.es`).
   - `FEED_REGENERATE_SECRET` → `openssl rand -hex 32`.
3. Desplegar (la scheduled function se registra sola con `netlify.toml`).
4. Abrir `/configuracion/google-merchant` en el CRM → pulsar "Regenerar feed ahora" → comprobar que `last_generated_at` se actualiza.
5. Abrir `https://midcar.es/api/feeds/merchant.xml?test=true` y validar el XML manualmente (checklist §9).
6. Pasar la URL `https://midcar.es/api/feeds/merchant.xml?test=true` al equipo SEO para la primera carga en Google Merchant Center.
7. Iterar sobre los errores que reporte Google → ajustar `buildItemDescription` / mapeo si hace falta.
8. Cuando esté validado, pasar a SEO la URL definitiva sin `?test=true`.
