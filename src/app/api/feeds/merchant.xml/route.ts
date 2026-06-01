import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
    buildMerchantFeed,
    buildFeedXml,
    FEED_CHANNEL_META,
    resolveSiteUrl,
} from '@/lib/feed-service'

// We read searchParams (?test=true), so the route must be dynamic.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

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

/**
 * Read the build-time generated feed XML if present. Tries the standard
 * Next.js public-dir location and the Netlify standalone fallback.
 */
async function readStaticFeed(): Promise<string | null> {
    const candidates = [
        path.join(process.cwd(), 'public', 'feeds', 'merchant.xml'),
        path.join(process.cwd(), '.next', 'standalone', 'public', 'feeds', 'merchant.xml'),
        path.join(process.cwd(), '.next', 'server', 'public', 'feeds', 'merchant.xml'),
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('test') === 'true'

    // Test mode: build live (2 items, fits comfortably under any timeout).
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

    // Production: always serve the build-time static file. Reading it is
    // sub-millisecond, so the request never approaches the Netlify timeout.
    // If the file is somehow missing, return a well-formed empty feed
    // (Google handles an empty feed gracefully — it just shows no products
    // for this refresh). The build script's `prebuild` step is what
    // refreshes the file.
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

    console.warn('[feed] static file not found — serving empty fallback')
    const fallback = buildFeedXml([], { ...FEED_CHANNEL_META, link: resolveSiteUrl() })
    return new Response(fallback, {
        status: 200,
        headers: {
            ...corsHeaders(),
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0',
            'X-Feed-Item-Count': '0',
            'X-Feed-Test-Mode': 'false',
            'X-Feed-Source': 'empty-fallback',
        },
    })
}
