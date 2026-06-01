import { NextRequest } from 'next/server'
import {
    buildMerchantFeed,
    buildFeedXml,
    FEED_CHANNEL_META,
    resolveSiteUrl,
} from '@/lib/feed-service'

// The build script writes the rendered feed XML into this module so it gets
// bundled with the lambda. No filesystem reads at runtime, no risk of the
// /public asset not being available, no scraping under request timeout.
import {
    MERCHANT_FEED_XML,
    MERCHANT_FEED_ITEM_COUNT,
    MERCHANT_FEED_GENERATED_AT,
} from '@/lib/generated/merchant-feed'

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

    // Production: serve the build-bundled XML. Constant-time, no I/O.
    return new Response(MERCHANT_FEED_XML, {
        status: 200,
        headers: {
            ...corsHeaders(),
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600',
            'Netlify-Vary': 'query=test',
            'X-Feed-Item-Count': String(MERCHANT_FEED_ITEM_COUNT),
            'X-Feed-Test-Mode': 'false',
            'X-Feed-Source': 'bundled',
            'X-Feed-Generated-At': MERCHANT_FEED_GENERATED_AT,
        },
    })
}
