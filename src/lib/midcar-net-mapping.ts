/**
 * Resolves canonical midcar.net URLs for vehicles we publish in our feed.
 *
 * Just Quality (the platform behind midcar.net) exposes a public endpoint that
 * lists every car they have, with the URL of the public ficha and a `plate`
 * (matrícula) field we can cross-reference against our CRM's `vehicles.matricula`.
 *
 * Two notes on the data shape:
 *   1. `vin` is in the endpoint schema but currently empty for every entry —
 *      Just Quality is still backfilling it. Once it's populated we'll switch
 *      the primary cross-reference key to VIN (it's universal and normalized,
 *      whereas plates can be re-issued).
 *   2. Only entries with `visible: true` and `vehicleStatus ∈ {0, 1}` are
 *      indexed; everything else (sold, hidden, draft) is dropped so we never
 *      link a publicly-visible product card to a dead landing page.
 */

const MAPPING_URL = process.env.MIDCAR_NET_MAPPING_URL
    || 'https://api.midcar.net/vehicles/feed-mapping'

const CACHE_TTL_MS = 15 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

export interface MidcarNetEntry {
    id: string
    url: string
    title: string
    make: string
    model: string
    year: number
    price: number
    /** 0 = en venta, 1 = reservado, 2 = vendido. */
    vehicleStatus: number
    visible: boolean
    plate?: string | null
    vin?: string | null
}

interface CacheEntry {
    at: number
    index: Map<string, string>
}

let cache: CacheEntry | null = null

/** Canonicalize a Spanish-style plate ("1234 ABC" / "1234-abc") to "1234ABC". */
export function normalizePlate(p: string | null | undefined): string | null {
    if (!p) return null
    const out = String(p).replace(/[\s-]/g, '').toUpperCase()
    return out || null
}

export async function fetchMidcarNetMapping(): Promise<MidcarNetEntry[]> {
    const res = await fetch(MAPPING_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
        throw new Error(`midcar.net mapping endpoint returned HTTP ${res.status}`)
    }
    const data = await res.json()
    if (!Array.isArray(data)) {
        throw new Error('midcar.net mapping endpoint returned a non-array body')
    }
    return data as MidcarNetEntry[]
}

/**
 * Returns Map<normalizedPlate, midcarNetUrl> for vehicles currently live on
 * midcar.net. Cached in-process for CACHE_TTL_MS to amortize over consecutive
 * feed requests. On fetch failure returns the previous cache if still warm,
 * otherwise an empty map so the feed degrades to its midcar.es fallback
 * instead of failing.
 */
export async function getMidcarNetPlateIndex(): Promise<Map<string, string>> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.index
    try {
        const entries = await fetchMidcarNetMapping()
        const index = new Map<string, string>()
        for (const e of entries) {
            if (!e.visible) continue
            if (e.vehicleStatus !== 0 && e.vehicleStatus !== 1) continue
            const plate = normalizePlate(e.plate)
            if (!plate) continue
            index.set(plate, e.url)
        }
        cache = { at: Date.now(), index }
        return index
    } catch (err) {
        console.error('[midcar-net-mapping] fetch failed:', err)
        return cache?.index ?? new Map()
    }
}

/** Test hook: wipe the in-process cache so each test starts cold. */
export function _resetMidcarNetCache(): void {
    cache = null
}
