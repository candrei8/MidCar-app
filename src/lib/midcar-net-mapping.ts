/**
 * Reads the live midcar.net inventory from Just Quality's public mapping
 * endpoint. The Google Merchant feed is built directly from this list — every
 * product link is guaranteed to be a midcar.net URL by construction.
 *
 * Schema notes:
 *   - `vin` is in the response but currently empty for every entry; Just
 *     Quality is still backfilling it.
 *   - Only entries with `visible: true` and `vehicleStatus ∈ {0, 1}` are
 *     considered live (en venta / reservado). Everything else (sold, hidden,
 *     draft) is filtered out so we never publish a dead landing page.
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
    entries: MidcarNetEntry[]
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
 * Returns the list of midcar.net vehicles currently live (visible + venta or
 * reservado). Cached in-process for CACHE_TTL_MS. On fetch failure returns
 * the stale cache if any, otherwise an empty list so callers can degrade.
 */
export async function getMidcarNetVisibleEntries(): Promise<MidcarNetEntry[]> {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.entries
    try {
        const all = await fetchMidcarNetMapping()
        const entries = all.filter(
            e => e.visible && (e.vehicleStatus === 0 || e.vehicleStatus === 1),
        )
        cache = { at: Date.now(), entries }
        return entries
    } catch (err) {
        console.error('[midcar-net-mapping] fetch failed:', err)
        return cache?.entries ?? []
    }
}

/** Test hook: wipe the in-process cache so each test starts cold. */
export function _resetMidcarNetCache(): void {
    cache = null
}
