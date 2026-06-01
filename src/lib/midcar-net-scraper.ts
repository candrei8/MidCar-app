/**
 * Scrapes the public midcar.net ficha for the data Just Quality's JSON
 * endpoint doesn't yet expose: the SEO-friendly description and the list
 * of vehicle photos. Everything we extract is stable metadata that
 * midcar.net already publishes for its own SEO, so we're not parsing the
 * rendered markup — just the `<meta>` head and the Azure CDN image URLs
 * that share the vehicle's id.
 *
 * In-process cache by midcar.net id, 24 h TTL — the feed is regenerated
 * daily by cron so first-cold-start cost is paid once a day.
 */

const FETCH_TIMEOUT_MS = 8_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
/** Google Merchant: 1 main + up to 10 additional. */
const MAX_ADDITIONAL_IMAGES = 10

export interface ScrapedVehicleFields {
    description: string
    mainImage: string | null
    additionalImages: string[]
}

const cache = new Map<string, { at: number; data: ScrapedVehicleFields }>()

export async function scrapeMidcarNetPage(
    midcarNetId: string,
    url: string,
): Promise<ScrapedVehicleFields | null> {
    const cached = cache.get(midcarNetId)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data

    let res: Response
    try {
        res = await fetch(url, {
            headers: { 'User-Agent': 'MidCarFeedBot/1.0 (+https://midcar.es)' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })
    } catch (err) {
        console.warn(`[scraper] fetch failed for ${url}: ${(err as Error).message}`)
        return null
    }
    if (!res.ok) {
        console.warn(`[scraper] ${url} returned HTTP ${res.status}`)
        return null
    }
    const html = await res.text()
    const data = parseVehicleHtml(html, midcarNetId)
    cache.set(midcarNetId, { at: Date.now(), data })
    return data
}

/**
 * Pure parser — exported for unit tests. Extracts:
 *   - `og:description` for the product description
 *   - All `midcar.azureedge.net/vehiculos/{id}/...` JPGs as the image list
 *     (the path segment is part of Azure's storage layout, not midcar.net
 *     templating, so it's stable across redesigns of the page)
 */
export function parseVehicleHtml(html: string, midcarNetId: string): ScrapedVehicleFields {
    const description = extractMetaProperty(html, 'og:description')
        || extractMetaName(html, 'description')
        || ''

    const imgPattern = new RegExp(
        `https://midcar[^"'\\s<>]*?/vehiculos/${escapeRegex(midcarNetId)}/[^"'\\s<>]*?\\.(?:jpg|jpeg|png|webp)`,
        'gi',
    )
    const allMatches = html.match(imgPattern) || []
    const deduped: string[] = []
    const seen = new Set<string>()
    for (const url of allMatches) {
        if (seen.has(url)) continue
        seen.add(url)
        deduped.push(url)
    }

    const [mainImage = null, ...rest] = deduped
    return {
        description: description.trim(),
        mainImage,
        additionalImages: rest.slice(0, MAX_ADDITIONAL_IMAGES),
    }
}

function extractMetaProperty(html: string, property: string): string | null {
    const re = new RegExp(
        `<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']*)["']`,
        'i',
    )
    const m = html.match(re)
    return m ? decodeHtmlEntities(m[1]) : null
}

function extractMetaName(html: string, name: string): string | null {
    const re = new RegExp(
        `<meta[^>]+name=["']${escapeRegex(name)}["'][^>]+content=["']([^"']*)["']`,
        'i',
    )
    const m = html.match(re)
    return m ? decodeHtmlEntities(m[1]) : null
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeHtmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
}

/** Test hook: wipe the in-process cache so each test starts cold. */
export function _resetMidcarNetScrapeCache(): void {
    cache.clear()
}
