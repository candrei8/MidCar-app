import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
    buildMerchantFeed,
    buildFeedXml,
    FEED_CHANNEL_META,
    resolveSiteUrl,
    recordFeedRun,
    getCachedFeedXml,
    persistFeedXml,
} from '@/lib/feed-service'

// We read searchParams (?test=true), so the route must be dynamic.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
/** Netlify default would be 10 s; bumped because cold-start regeneration
 *  hits ~95 midcar.net fichas and the rendered XML can take 15-20 s. */
export const maxDuration = 26

/**
 * Read the build-time generated feed XML if present. Tries the standard
 * Next.js public-dir location and the Netlify standalone fallback.
 */
async function readStaticFeed(): Promise<string | null> {
    const candidates = [
        path.join(process.cwd(), 'public', 'feeds', 'merchant.xml'),
        path.join(process.cwd(), '.next', 'standalone', 'public', 'feeds', 'merchant.xml'),
    ]
    for (const p of candidates) {
        try {
            const xml = await readFile(p, 'utf8')
            if (xml.includes('<item>')) return xml
        } catch {
            // file not found / unreadable — try the next candidate
        }
    }
    return null
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
}

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('test') === 'true'

    // ── Test mode: always build live (small, fast, no caching) ────────────────
    if (testMode) {
        try {
            const { xml, itemCount } = await buildMerchantFeed({ testMode: true })
            return new Response(xml, {
                status: 200,
                headers: {
                    ...corsHeaders(),
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'no-store, max-age=0',
                    'Netlify-Vary': 'query=test',
                    'X-Feed-Item-Count': String(itemCount),
                    'X-Feed-Test-Mode': 'true',
                    'X-Feed-Source': 'live',
                },
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            console.error('Test feed generation failed:', err)
            const fallback = buildFeedXml([], { ...FEED_CHANNEL_META, link: resolveSiteUrl() })
            return new Response(fallback, {
                status: 200,
                headers: {
                    ...corsHeaders(),
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'no-store, max-age=0',
                    'X-Feed-Error': message.slice(0, 200),
                    'X-Feed-Test-Mode': 'true',
                },
            })
        }
    }

    // ── Production: serve the pre-rendered static file shipped by the build ──
    // `scripts/build-merchant-feed.mjs` writes public/feeds/merchant.xml on
    // every Netlify deploy; reading it here is ~1 ms and avoids the 10 s
    // function timeout that scraping 95 fichas would hit.
    const staticXml = await readStaticFeed()
    if (staticXml) {
        const itemCount = (staticXml.match(/<item>/g) || []).length
        return new Response(staticXml, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
                'Netlify-Vary': 'query=test',
                'X-Feed-Item-Count': String(itemCount),
                'X-Feed-Test-Mode': 'false',
                'X-Feed-Source': 'static',
            },
        })
    }

    // ── Fallback: try the Supabase cache (legacy path, kept for resilience) ──
    const cached = await getCachedFeedXml('merchant')
    if (cached && cached.itemCount > 0) {
        return new Response(cached.xml, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
                'Netlify-Vary': 'query=test',
                'X-Feed-Item-Count': String(cached.itemCount),
                'X-Feed-Test-Mode': 'false',
                'X-Feed-Source': 'cache',
                'X-Feed-Generated-At': cached.generatedAt,
            },
        })
    }

    // No cache yet — first call after deploy. Build inline and persist for
    // future calls. May time out on very cold starts; the cron will refill.
    try {
        const { xml, itemCount } = await buildMerchantFeed()
        // Persist + record metadata in parallel; never let either fail the response.
        Promise.all([
            persistFeedXml({ xml, itemCount }).catch(e => console.error('persistFeedXml failed:', e)),
            recordFeedRun({ status: 'ok', itemCount, triggeredBy: 'pull:cold-build' })
                .catch(e => console.error('recordFeedRun failed:', e)),
        ])
        return new Response(xml, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
                'Netlify-Vary': 'query=test',
                'X-Feed-Item-Count': String(itemCount),
                'X-Feed-Test-Mode': 'false',
                'X-Feed-Source': 'cold-build',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Merchant feed generation failed:', error)
        recordFeedRun({ status: 'error', errorMessage: message, triggeredBy: 'pull:cold-build' })
            .catch(e => console.error('recordFeedRun failed:', e))
        const fallback = buildFeedXml([], { ...FEED_CHANNEL_META, link: resolveSiteUrl() })
        return new Response(fallback, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0',
                'X-Feed-Error': message.slice(0, 200),
                'X-Feed-Test-Mode': 'false',
                'X-Feed-Source': 'error-fallback',
            },
        })
    }
}
