/**
 * Google Merchant XML feed generator.
 *
 * Pure helpers are exported so they can be unit-tested without touching Supabase.
 * `buildMerchantFeed` is the only async function: it queries the DB and serializes.
 *
 * Spec: RSS 2.0 + `xmlns:g="http://base.google.com/ns/1.0"`, UTF-8, EUR, es-ES.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Server-side client with the service_role key — bypasses RLS so the cron
 * (which authenticates with FEED_REGENERATE_SECRET, not a user JWT) can write
 * to `feed_metadata`. Falls back to the anon client when the service key is
 * not configured (e.g. local dev), in which case writes will rely on RLS
 * policies for the `authenticated` role.
 */
let cachedAdminClient: SupabaseClient | null = null
function getAdminClient(): SupabaseClient {
    if (cachedAdminClient) return cachedAdminClient

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (typeof window === 'undefined' && url && serviceKey) {
        cachedAdminClient = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        })
        return cachedAdminClient
    }

    return supabase
}

// ============================================================================
// Types
// ============================================================================

export interface VehicleImageInput {
    url: string
    es_principal?: boolean
    orden?: number
}

export interface VehicleFeedInput {
    id: string
    stock_id: string
    matricula?: string | null
    vin?: string | null
    estado: string
    incluir_en_feed?: boolean
    marca: string
    modelo: string
    version?: string | null
    año_matriculacion?: number | null
    año_fabricacion?: number | null
    tipo_motor?: string | null
    cilindrada?: number | null
    potencia_cv?: number | null
    combustible?: string | null
    transmision?: string | null
    etiqueta_dgt?: string | null
    color_exterior?: string | null
    kilometraje?: number | null
    num_propietarios?: number | null
    garantia_meses?: number | null
    precio_venta: number
    descuento?: number | null
    imagen_principal?: string | null
    imagenes?: VehicleImageInput[] | null
    descripcion?: string | null
    url_web?: string | null
    created_at?: string
}

export interface FeedBuildOptions {
    /** If true, return at most 2 items (for the initial Google Merchant validation). */
    testMode?: boolean
    /** Override SITE_URL (used in tests). */
    siteUrl?: string
}

export interface FeedBuildResult {
    xml: string
    itemCount: number
    generatedAt: string
}

export interface ChannelMeta {
    title: string
    link: string
    description: string
}

// ============================================================================
// Constants
// ============================================================================

export const FEED_CHANNEL_META: ChannelMeta = {
    title: 'MidCar — Catálogo de Vehículos de Ocasión',
    link: 'https://midcar.es',
    description: 'Feed de inventario de MidCar para Google Merchant',
}

export const FEED_ELIGIBLE_STATES = ['disponible', 'reservado'] as const
export const MAX_ADDITIONAL_IMAGES = 10
export const MAX_TITLE_LENGTH = 150
export const TEST_MODE_LIMIT = 2
export const FULL_FEED_HARD_LIMIT = 5000

const FEED_VEHICLE_FIELDS = `
  id,
  stock_id,
  matricula,
  vin,
  estado,
  incluir_en_feed,
  marca,
  modelo,
  version,
  año_matriculacion,
  año_fabricacion,
  tipo_motor,
  cilindrada,
  potencia_cv,
  combustible,
  transmision,
  etiqueta_dgt,
  color_exterior,
  kilometraje,
  num_propietarios,
  garantia_meses,
  precio_venta,
  descuento,
  imagen_principal,
  imagenes,
  descripcion,
  url_web,
  created_at
`

// ============================================================================
// Pure helpers (exported for testing)
// ============================================================================

/** Escape the 5 XML entities. Use for attribute values and URLs in tags. */
export function escapeXml(str: string): string {
    if (str == null) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

/**
 * Wrap text in CDATA, safely splitting any `]]>` sequence that would otherwise
 * close the section prematurely.
 */
export function wrapCdata(str: string): string {
    if (str == null) return '<![CDATA[]]>'
    const safe = String(str).replace(/]]>/g, ']]]]><![CDATA[>')
    return `<![CDATA[${safe}]]>`
}

/** Strip HTML tags, control chars, collapse whitespace. */
export function sanitizeText(str: string): string {
    if (!str) return ''
    return String(str)
        .replace(/<[^>]+>/g, ' ')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Format a number as `15990.00 EUR`. */
export function formatPrice(amount: number): string {
    const n = Number(amount) || 0
    return `${n.toFixed(2)} EUR`
}

/** Build a kebab-case URL slug without accents. */
export function buildItemSlug(v: Pick<VehicleFeedInput, 'marca' | 'modelo' | 'año_matriculacion' | 'stock_id'>): string {
    const raw = [v.marca, v.modelo, v.año_matriculacion, v.stock_id]
        .filter(Boolean)
        .join('-')
    return raw
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

/** Title: "Marca Modelo Año Version", truncated to MAX_TITLE_LENGTH. */
export function buildItemTitle(v: VehicleFeedInput): string {
    const parts = [v.marca, v.modelo, v.año_matriculacion?.toString(), v.version]
        .filter((p): p is string => Boolean(p && String(p).trim()))
    const title = parts.join(' ').trim()
    if (title.length <= MAX_TITLE_LENGTH) return title
    return title.slice(0, MAX_TITLE_LENGTH - 3).trimEnd() + '...'
}

/**
 * Canonical link rules (in order):
 *   1. `url_web` if it's HTTP/HTTPS (manually set per-vehicle in the CRM).
 *   2. `${siteUrl}/vehiculos/{matricula-sin-espacios}` — same path used by the
 *      printed QR codes (PrintableAd, ShareModal) so we stay consistent with
 *      midcar.es's public vehicle pages.
 *   3. Final fallback `${siteUrl}/vehiculos/{slug}` only when the vehicle
 *      has no matricula (should not happen — column is NOT NULL).
 */
export function buildItemLink(v: VehicleFeedInput, siteUrl: string): string {
    if (v.url_web && /^https?:\/\//i.test(v.url_web)) return v.url_web
    const base = siteUrl.replace(/\/+$/, '')
    const matricula = (v.matricula || '').replace(/\s+/g, '').toUpperCase()
    if (matricula) return `${base}/vehiculos/${matricula}`
    return `${base}/vehiculos/${buildItemSlug(v)}`
}

/**
 * Description: use `descripcion` if present and ≥ 50 chars; otherwise autogenerate
 * from technical fields. Always sanitized (HTML stripped, whitespace collapsed).
 */
export function buildItemDescription(v: VehicleFeedInput): string {
    const provided = sanitizeText(v.descripcion || '')
    if (provided.length >= 50) return provided

    const parts: string[] = []
    const headline = [v.marca, v.modelo, v.version].filter(Boolean).join(' ')
    if (v.año_matriculacion) {
        parts.push(`${headline} del año ${v.año_matriculacion}.`)
    } else if (headline) {
        parts.push(`${headline}.`)
    }

    const tech: string[] = []
    if (v.tipo_motor) tech.push(`motor ${v.tipo_motor}`)
    if (v.cilindrada) tech.push(`${v.cilindrada}cc`)
    if (v.potencia_cv) tech.push(`${v.potencia_cv}CV`)
    if (v.combustible) tech.push(`combustible ${v.combustible}`)
    if (v.transmision) tech.push(`cambio ${v.transmision}`)
    if (tech.length) parts.push(tech.join(', ') + '.')

    const history: string[] = []
    if (v.kilometraje && v.kilometraje > 0) {
        history.push(`${v.kilometraje.toLocaleString('es-ES')} km`)
    }
    if (v.num_propietarios && v.num_propietarios > 0) {
        history.push(`${v.num_propietarios} propietario${v.num_propietarios > 1 ? 's' : ''}`)
    }
    if (v.etiqueta_dgt) history.push(`etiqueta DGT ${v.etiqueta_dgt}`)
    if (v.color_exterior) history.push(`color ${v.color_exterior}`)
    if (history.length) parts.push(history.join('. ') + '.')

    if (v.garantia_meses && v.garantia_meses > 0) {
        parts.push(`Garantía de ${v.garantia_meses} meses.`)
    }
    parts.push('Vehículo disponible en MidCar.')

    return sanitizeText(parts.join(' '))
}

/** Reasons why a vehicle is excluded from the feed (empty array = eligible). */
export function feedExclusionReasons(v: VehicleFeedInput): string[] {
    const reasons: string[] = []
    if (v.incluir_en_feed === false) reasons.push('marcado como excluido del feed')
    if (!FEED_ELIGIBLE_STATES.includes(v.estado as typeof FEED_ELIGIBLE_STATES[number])) {
        reasons.push(`estado «${v.estado}» no elegible`)
    }
    if (!v.precio_venta || Number(v.precio_venta) <= 0) reasons.push('sin precio de venta')
    if (!v.marca || !String(v.marca).trim()) reasons.push('sin marca')
    if (!v.modelo || !String(v.modelo).trim()) reasons.push('sin modelo')
    if (!v.imagen_principal || !/^https?:\/\//i.test(v.imagen_principal)) {
        reasons.push('sin imagen principal HTTPS válida')
    }
    if (!v.stock_id || !String(v.stock_id).trim()) reasons.push('sin stock_id')
    return reasons
}

export function isEligibleForFeed(v: VehicleFeedInput): boolean {
    return feedExclusionReasons(v).length === 0
}

/** Serialize one vehicle as a single `<item>` block (no leading indent beyond 4 spaces). */
export function serializeItem(v: VehicleFeedInput, siteUrl: string): string {
    const precioBase = Number(v.precio_venta) || 0
    const descuento = Math.max(0, Number(v.descuento) || 0)
    const precioEfectivo = Math.max(0, precioBase - descuento)
    const hasSale = descuento > 0 && precioEfectivo > 0 && precioEfectivo < precioBase

    const title = buildItemTitle(v)
    const description = buildItemDescription(v)
    const link = buildItemLink(v, siteUrl)
    const availability = v.estado === 'disponible' ? 'in_stock' : 'out_of_stock'
    const productType = `Vehículos > Coches de ocasión > ${v.marca}`
    const mpn = (v.vin && v.vin.trim()) || v.stock_id

    const seenUrls = new Set<string>([v.imagen_principal as string])
    const additionalImages = (v.imagenes || [])
        .map(img => (typeof img === 'string' ? { url: img } : img))
        .filter(img => img && img.url && /^https?:\/\//i.test(img.url))
        .filter(img => {
            if (seenUrls.has(img.url)) return false
            seenUrls.add(img.url)
            return true
        })
        .slice(0, MAX_ADDITIONAL_IMAGES)
        .map(img => `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`)
        .join('\n')

    const saleLine = hasSale
        ? `\n      <g:sale_price>${escapeXml(formatPrice(precioEfectivo))}</g:sale_price>`
        : ''

    return [
        '    <item>',
        `      <g:id>${escapeXml(v.stock_id)}</g:id>`,
        `      <title>${wrapCdata(title)}</title>`,
        `      <description>${wrapCdata(description)}</description>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <g:image_link>${escapeXml(v.imagen_principal as string)}</g:image_link>`,
        additionalImages,
        `      <g:brand>${wrapCdata(v.marca)}</g:brand>`,
        `      <g:mpn>${escapeXml(mpn)}</g:mpn>`,
        `      <g:condition>used</g:condition>`,
        `      <g:availability>${availability}</g:availability>`,
        `      <g:price>${escapeXml(formatPrice(precioBase))}</g:price>${saleLine}`,
        `      <g:google_product_category>Vehicles &amp; Parts &gt; Vehicles &gt; Motor Vehicles &gt; Cars, Trucks &amp; Vans</g:google_product_category>`,
        `      <g:product_type>${wrapCdata(productType)}</g:product_type>`,
        `      <g:identifier_exists>no</g:identifier_exists>`,
        '    </item>',
    ].filter(line => line !== '').join('\n')
}

/** Build the complete RSS XML document. */
export function buildFeedXml(items: string[], channelMeta: ChannelMeta = FEED_CHANNEL_META): string {
    const itemsBlock = items.length ? items.join('\n') : ''
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${wrapCdata(channelMeta.title)}</title>
    <link>${escapeXml(channelMeta.link)}</link>
    <description>${wrapCdata(channelMeta.description)}</description>
${itemsBlock}
  </channel>
</rss>
`
}

// ============================================================================
// Resolve the site URL used to build canonical links
// ============================================================================

export function resolveSiteUrl(override?: string): string {
    const candidate = override
        || process.env.SITE_URL
        || process.env.NEXT_PUBLIC_SITE_URL
        || FEED_CHANNEL_META.link
    return candidate.replace(/\/+$/, '')
}

// ============================================================================
// Main entry: query DB and build the feed
// ============================================================================

export async function fetchEligibleVehicles(limit: number): Promise<VehicleFeedInput[]> {
    // Use admin client server-side: avoids any future RLS tightening on vehicles
    // breaking the feed silently. Reads are equivalent under current policies.
    const client = getAdminClient()
    const { data, error } = await client
        .from('vehicles')
        .select(FEED_VEHICLE_FIELDS)
        .eq('incluir_en_feed', true)
        .in('estado', FEED_ELIGIBLE_STATES as unknown as string[])
        .gt('precio_venta', 0)
        .not('imagen_principal', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(`Supabase query failed: ${error.message}`)
    }
    return (data || []) as unknown as VehicleFeedInput[]
}

export async function buildMerchantFeed(opts: FeedBuildOptions = {}): Promise<FeedBuildResult> {
    const siteUrl = resolveSiteUrl(opts.siteUrl)
    const limit = opts.testMode ? TEST_MODE_LIMIT : FULL_FEED_HARD_LIMIT

    const vehicles = await fetchEligibleVehicles(limit)
    const eligible = vehicles.filter(isEligibleForFeed)
    const finalList = opts.testMode ? eligible.slice(0, TEST_MODE_LIMIT) : eligible

    const items = finalList.map(v => serializeItem(v, siteUrl))
    const channelMeta: ChannelMeta = { ...FEED_CHANNEL_META, link: siteUrl }
    const xml = buildFeedXml(items, channelMeta)

    return {
        xml,
        itemCount: items.length,
        generatedAt: new Date().toISOString(),
    }
}

// ============================================================================
// Feed metadata persistence (for the "last generated" UI)
// ============================================================================

export interface FeedMetadataRow {
    id: string
    last_generated_at: string | null
    item_count: number
    status: 'pending' | 'ok' | 'error'
    error_message: string | null
    triggered_by: string | null
    updated_at: string
}

export async function getFeedMetadata(id: string = 'merchant'): Promise<FeedMetadataRow | null> {
    // SELECT policy on feed_metadata is open (anon + authenticated), so anon is fine.
    const { data, error } = await supabase
        .from('feed_metadata')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    if (error) {
        console.error('feed_metadata read failed:', error)
        return null
    }
    return (data || null) as FeedMetadataRow | null
}

export async function recordFeedRun(args: {
    id?: string
    status: 'ok' | 'error'
    itemCount?: number
    errorMessage?: string | null
    triggeredBy: string
}): Promise<void> {
    const payload = {
        id: args.id || 'merchant',
        last_generated_at: new Date().toISOString(),
        item_count: args.itemCount || 0,
        status: args.status,
        error_message: args.errorMessage || null,
        triggered_by: args.triggeredBy,
        updated_at: new Date().toISOString(),
    }
    // Writes go through the admin client so the cron (no user JWT) can update
    // metadata too. CRM-user-triggered writes also succeed via this path.
    const client = getAdminClient()
    const { error } = await client
        .from('feed_metadata')
        .upsert(payload, { onConflict: 'id' })
    if (error) {
        console.error('feed_metadata write failed:', error)
    }
}
