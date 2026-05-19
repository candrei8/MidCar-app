import { NextRequest } from 'next/server'
import { buildMerchantFeed, buildFeedXml, FEED_CHANNEL_META, resolveSiteUrl, recordFeedRun } from '@/lib/feed-service'

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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('test') === 'true'

    try {
        const { xml, itemCount } = await buildMerchantFeed({ testMode })

        const cacheControl = testMode
            ? 'no-store, max-age=0'
            : 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600'

        // Best-effort metadata write — never fail the request because of it.
        if (!testMode) {
            recordFeedRun({
                status: 'ok',
                itemCount,
                triggeredBy: 'pull:get',
            }).catch(err => console.error('recordFeedRun failed:', err))
        }

        return new Response(xml, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': cacheControl,
                'X-Feed-Item-Count': String(itemCount),
                'X-Feed-Test-Mode': testMode ? 'true' : 'false',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Merchant feed generation failed:', error)

        recordFeedRun({
            status: 'error',
            errorMessage: message,
            triggeredBy: 'pull:get',
        }).catch(err => console.error('recordFeedRun failed:', err))

        // Always return a valid (empty) XML so Google's fetcher doesn't see a 500.
        const fallback = buildFeedXml([], {
            ...FEED_CHANNEL_META,
            link: resolveSiteUrl(),
        })

        return new Response(fallback, {
            status: 200,
            headers: {
                ...corsHeaders(),
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0',
                'X-Feed-Error': 'true',
            },
        })
    }
}
