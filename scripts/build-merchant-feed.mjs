#!/usr/bin/env node
/**
 * Build-time generator for the Google Merchant feed. Runs as `prebuild`,
 * fetches Just Quality's mapping endpoint and scrapes each midcar.net
 * ficha to produce a fully-rendered XML at public/feeds/merchant.xml.
 *
 * Why build-time and not request-time:
 *   - 95 page scrapes take 15-25 s end-to-end.
 *   - Netlify Functions cap at 10 s on the free tier — every cold-start
 *     request times out and returns an empty fallback.
 *   - Netlify Builds get 15 min, which is plenty.
 *
 * Output: public/feeds/merchant.xml — served as a static file by Netlify's
 * CDN. The /api/feeds/merchant.xml route reads this file from disk so the
 * URL Google Merchant has configured doesn't change.
 *
 * Refresh cadence: every Netlify deploy. To refresh daily without a code
 * change, point a cron (GitHub Actions, cron-job.org, etc.) at the
 * Netlify Build Hook.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAPPING_URL = process.env.MIDCAR_NET_MAPPING_URL
    || 'https://api.midcar.net/vehicles/feed-mapping'
const SCRAPE_CONCURRENCY = 10
const SCRAPE_TIMEOUT_MS = 25_000
const RETRY_TIMEOUT_MS = 45_000
const MAPPING_TIMEOUT_MS = 15_000
const MAX_ADDITIONAL_IMAGES = 10
const MAX_TITLE_LENGTH = 150

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '..', 'public', 'feeds', 'merchant.xml')

const FEED_CHANNEL = {
    title: 'MidCar — Catálogo de Vehículos de Ocasión',
    link: 'https://midcar.es',
    description: 'Feed de inventario de MidCar para Google Merchant',
}

// ---------------------------------------------------------------------------
// XML helpers (mirror src/lib/feed-service.ts)
// ---------------------------------------------------------------------------

function escapeXml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function wrapCdata(s) {
    if (s == null) return '<![CDATA[]]>'
    const safe = String(s).replace(/]]>/g, ']]]]><![CDATA[>')
    return `<![CDATA[${safe}]]>`
}

function sanitizeText(s) {
    if (!s) return ''
    return String(s)
        .replace(/<[^>]+>/g, ' ')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function formatPrice(amount) {
    const n = Number(amount) || 0
    return `${n.toFixed(2)} EUR`
}

function decodeHtmlEntities(s) {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
        return await fetch(url, {
            headers: { 'User-Agent': 'MidCarFeedBuilder/1.0 (+https://midcar.es)' },
            signal: controller.signal,
        })
    } finally {
        clearTimeout(id)
    }
}

async function fetchMapping() {
    const res = await fetchWithTimeout(MAPPING_URL, MAPPING_TIMEOUT_MS)
    if (!res.ok) throw new Error(`mapping endpoint returned HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('mapping endpoint returned non-array body')
    return data
}

// ---------------------------------------------------------------------------
// Page scrape
// ---------------------------------------------------------------------------

function parseVehicleHtml(html, midcarNetId) {
    const ogDesc = matchMetaProperty(html, 'og:description')
    const metaDesc = matchMetaName(html, 'description')
    const description = (ogDesc || metaDesc || '').trim()

    const imgPattern = new RegExp(
        `https://midcar[^"'\\s<>]*?/vehiculos/${escapeRegex(midcarNetId)}/[^"'\\s<>]*?\\.(?:jpg|jpeg|png|webp)`,
        'gi',
    )
    const allMatches = html.match(imgPattern) || []
    const seen = new Set()
    const deduped = []
    for (const url of allMatches) {
        if (seen.has(url)) continue
        seen.add(url)
        deduped.push(url)
    }
    const [mainImage = null, ...rest] = deduped
    return { description, mainImage, additionalImages: rest.slice(0, MAX_ADDITIONAL_IMAGES) }
}

function matchMetaProperty(html, property) {
    const re = new RegExp(
        `<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']*)["']`,
        'i',
    )
    const m = html.match(re)
    return m ? decodeHtmlEntities(m[1]) : null
}

function matchMetaName(html, name) {
    const re = new RegExp(
        `<meta[^>]+name=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["']`,
        'i',
    )
    const m = html.match(re)
    return m ? decodeHtmlEntities(m[1]) : null
}

async function scrapePage(entry, timeoutMs) {
    try {
        const res = await fetchWithTimeout(entry.url, timeoutMs)
        if (!res.ok) {
            return { ok: false, reason: `HTTP ${res.status}` }
        }
        const html = await res.text()
        return { ok: true, data: parseVehicleHtml(html, entry.id) }
    } catch (err) {
        return { ok: false, reason: err.message }
    }
}

async function scrapeBatch(entries, concurrency, timeoutMs) {
    const results = new Array(entries.length)
    let cursor = 0
    async function worker() {
        while (true) {
            const i = cursor++
            if (i >= entries.length) return
            results[i] = await scrapePage(entries[i], timeoutMs)
        }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))
    return results
}

async function scrapeAll(entries) {
    console.log(`[feed-build] scraping pass 1 (n=${entries.length}, concurrency=${SCRAPE_CONCURRENCY}, timeout=${SCRAPE_TIMEOUT_MS}ms)`)
    const r1 = await scrapeBatch(entries, SCRAPE_CONCURRENCY, SCRAPE_TIMEOUT_MS)

    const failedIdx = r1.map((r, i) => (r.ok ? -1 : i)).filter(i => i >= 0)
    if (failedIdx.length === 0) return r1

    console.log(`[feed-build] pass 1: ${entries.length - failedIdx.length}/${entries.length} ok, retrying ${failedIdx.length} with longer timeout`)
    const retryEntries = failedIdx.map(i => entries[i])
    const r2 = await scrapeBatch(retryEntries, 3, RETRY_TIMEOUT_MS)
    for (let k = 0; k < failedIdx.length; k++) {
        r1[failedIdx[k]] = r2[k]
    }
    return r1
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function serializeItem(entry, scraped) {
    const price = Number(entry.price) || 0
    if (price <= 0) return null
    if (!scraped || !scraped.mainImage) return null

    const title = sanitizeText(entry.title).slice(0, MAX_TITLE_LENGTH)
    const description = scraped.description
        || `${entry.title}. Año ${entry.year}. ${formatPrice(price)}. Vehículo disponible en MIDCar.`
    const brand = sanitizeText(entry.make || '')
    const productType = `Vehículos > Coches de ocasión > ${brand}`
    const availability = entry.vehicleStatus === 0 ? 'in_stock' : 'out_of_stock'

    const additionalImagesXml = scraped.additionalImages
        .filter(u => /^https?:\/\//i.test(u))
        .slice(0, MAX_ADDITIONAL_IMAGES)
        .map(u => `      <g:additional_image_link>${escapeXml(u)}</g:additional_image_link>`)
        .join('\n')

    return [
        '    <item>',
        `      <g:id>${escapeXml(entry.id)}</g:id>`,
        `      <title>${wrapCdata(title)}</title>`,
        `      <description>${wrapCdata(description)}</description>`,
        `      <link>${escapeXml(entry.url)}</link>`,
        `      <g:image_link>${escapeXml(scraped.mainImage)}</g:image_link>`,
        additionalImagesXml,
        `      <g:brand>${wrapCdata(brand)}</g:brand>`,
        `      <g:mpn>${escapeXml(entry.id)}</g:mpn>`,
        `      <g:condition>used</g:condition>`,
        `      <g:availability>${availability}</g:availability>`,
        `      <g:price>${escapeXml(formatPrice(price))}</g:price>`,
        `      <g:google_product_category>Vehicles &amp; Parts &gt; Vehicles &gt; Motor Vehicles &gt; Cars, Trucks &amp; Vans</g:google_product_category>`,
        `      <g:product_type>${wrapCdata(productType)}</g:product_type>`,
        `      <g:identifier_exists>no</g:identifier_exists>`,
        '    </item>',
    ].filter(line => line !== '').join('\n')
}

function buildFeedXml(items) {
    const itemsBlock = items.length ? items.join('\n') : ''
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${wrapCdata(FEED_CHANNEL.title)}</title>
    <link>${escapeXml(FEED_CHANNEL.link)}</link>
    <description>${wrapCdata(FEED_CHANNEL.description)}</description>
    <language>es-ES</language>
${itemsBlock}
  </channel>
</rss>
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const t0 = Date.now()
    console.log(`[feed-build] mapping ← ${MAPPING_URL}`)
    const all = await fetchMapping()
    const entries = all.filter(e => e.visible && (e.vehicleStatus === 0 || e.vehicleStatus === 1))
    console.log(`[feed-build] ${all.length} entries, ${entries.length} visible+venta`)

    const scraped = await scrapeAll(entries)
    const items = []
    const skippedReasons = []
    for (let i = 0; i < entries.length; i++) {
        const r = scraped[i]
        const data = r.ok ? r.data : null
        const item = serializeItem(entries[i], data)
        if (item) {
            items.push(item)
        } else {
            const why = !r.ok ? r.reason : !data?.mainImage ? 'no main image after scrape' : 'invalid (price 0?)'
            skippedReasons.push({ id: entries[i].id, url: entries[i].url, why })
        }
    }
    console.log(`[feed-build] ${items.length} items serialized, ${skippedReasons.length} skipped`)
    if (skippedReasons.length > 0) {
        console.log('[feed-build] skipped items:')
        for (const s of skippedReasons) {
            console.log(`  ${s.id} (${s.why}) — ${s.url}`)
        }
    }

    if (items.length === 0) {
        console.warn(`[feed-build] WARN: no items serialized — leaving any existing ${OUTPUT_PATH} untouched`)
        return
    }

    const xml = buildFeedXml(items)
    await mkdir(dirname(OUTPUT_PATH), { recursive: true })
    await writeFile(OUTPUT_PATH, xml, 'utf8')
    const seconds = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`[feed-build] wrote ${OUTPUT_PATH} (${xml.length} bytes, ${items.length} items) in ${seconds}s`)
}

main().catch(err => {
    // Never abort the Netlify build on a transient scrape failure — the
    // previously-committed public/feeds/merchant.xml will still be served.
    console.error('[feed-build] non-fatal error (build continues):', err)
    process.exit(0)
})
