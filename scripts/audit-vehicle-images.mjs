#!/usr/bin/env node
/**
 * Auditoría (y reparación opcional) de las imágenes de los vehículos disponibles.
 *
 * Problema que cubre: las fotos viven en el CDN de Just Quality
 * (midcar.azureedge.net). Cuando JQ re-sube las fotos de un coche, las URLs
 * antiguas guardadas en `vehicles.imagenes` devuelven 404 y la web muestra
 * el placeholder.
 *
 * Uso:
 *   node scripts/audit-vehicle-images.mjs                # solo auditar (anon key)
 *   node scripts/audit-vehicle-images.mjs --repair       # además, re-scrapea la
 *     ficha de midcar.net y actualiza Supabase (requiere SUPABASE_SERVICE_ROLE_KEY)
 *
 * Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *            SUPABASE_SERVICE_ROLE_KEY (solo --repair)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvwxgzwremuijxinrvxw.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const REPAIR = process.argv.includes('--repair')
const FEED_MAPPING = 'https://api.midcar.net/vehicles/feed-mapping'

if (!ANON_KEY) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}
if (REPAIR && !SERVICE_KEY) {
  console.error('--repair requiere SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    return r.ok
  } catch {
    return false
  }
}

// 1. Vehículos disponibles
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/vehicles?select=id,stock_id,matricula,marca,modelo,imagen_principal,imagenes&estado=eq.disponible`,
  { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
)
const vehicles = await res.json()
console.log(`Vehículos disponibles: ${vehicles.length}`)

// 2. Detectar rotos (primera imagen 404 y, para confirmar, también la segunda)
const broken = []
const queue = [...vehicles]
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const v = queue.pop()
      const imgs = (v.imagenes || []).sort((a, b) => a.orden - b.orden).map((i) => i.url).filter(Boolean)
      const first = imgs[0] || v.imagen_principal
      if (!first) {
        broken.push({ v, reason: 'sin imágenes' })
        continue
      }
      if (!(await headOk(first))) {
        const secondOk = imgs[1] ? await headOk(imgs[1]) : false
        if (!secondOk) broken.push({ v, reason: 'imágenes 404' })
      }
    }
  })
)

if (broken.length === 0) {
  console.log('✓ Todas las imágenes responden. Nada que reparar.')
  process.exit(0)
}
console.log(`✗ Vehículos con imágenes rotas: ${broken.length}`)
for (const b of broken) {
  console.log(`  - ${b.v.marca} ${(b.v.modelo || '').slice(0, 40)} (${b.v.stock_id}) — ${b.reason}`)
}
if (!REPAIR) {
  console.log('\nEjecuta con --repair (y SUPABASE_SERVICE_ROLE_KEY) para arreglarlos desde midcar.net.')
  process.exit(2)
}

// 3. Reparar: localizar la ficha vigente en midcar.net y re-extraer las fotos
const mapping = await (await fetch(FEED_MAPPING)).json()
const byId = new Map(mapping.map((m) => [String(m.id), m]))
const byPlate = new Map(mapping.map((m) => [String(m.plate || '').toUpperCase(), m]))

let repaired = 0
for (const { v } of broken) {
  const rawId = String(v.stock_id || '').replace(/^STK-/, '')
  const entry = byId.get(rawId) || byPlate.get(String(v.matricula || '').toUpperCase())
  if (!entry) {
    console.log(`  ! ${v.stock_id}: sin ficha en midcar.net — revisar a mano`)
    continue
  }
  const html = await (await fetch(entry.url)).text()
  const re = new RegExp(`https://midcar\\.azureedge\\.net/vehiculos/${entry.id}/[^"' )]*?-1500px\\.jpg`, 'g')
  const seen = new Set()
  const urls = []
  for (const m of html.matchAll(re)) {
    if (!seen.has(m[0])) {
      seen.add(m[0])
      urls.push(m[0])
    }
  }
  if (!urls.length) {
    console.log(`  ! ${v.stock_id}: la ficha no expone imágenes — revisar a mano`)
    continue
  }
  const imagenes = urls.map((url, i) => ({ url, orden: i + 1, es_principal: i === 0 }))
  const upd = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?id=eq.${v.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ imagenes, imagen_principal: urls[0] }),
  })
  if (upd.ok) {
    repaired++
    console.log(`  ✓ ${v.stock_id}: ${urls.length} fotos actualizadas`)
  } else {
    console.log(`  ✗ ${v.stock_id}: PATCH falló (${upd.status})`)
  }
}
console.log(`\nReparados ${repaired}/${broken.length}`)
