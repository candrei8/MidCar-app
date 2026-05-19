/**
 * Netlify Scheduled Function — runs daily at 02:00 UTC (03:00 Europe/Madrid in winter,
 * 04:00 in summer; either way, well outside business hours).
 *
 * It calls the protected POST /api/feeds/merchant/regenerate endpoint of the live
 * Next.js app, which:
 *   1. rebuilds the XML feed,
 *   2. busts the CDN cache for /api/feeds/merchant.xml,
 *   3. writes a row in `feed_metadata` so the CRM UI can show "last regenerated at".
 *
 * Requires the FEED_REGENERATE_SECRET env var to be configured in Netlify.
 */

// Minimal local typing — avoids requiring `@netlify/functions` as a build-time dep.
// The actual runtime contract is provided by Netlify when the function is invoked.
interface NetlifyScheduledConfig {
    schedule: string
}
type Config = NetlifyScheduledConfig

export default async () => {
    const baseUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_URL
    const secret = process.env.FEED_REGENERATE_SECRET

    if (!baseUrl) {
        console.error('regenerate-feed: no base URL available (SITE_URL/URL/DEPLOY_URL all empty)')
        return new Response('Missing base URL', { status: 500 })
    }
    if (!secret) {
        console.error('regenerate-feed: FEED_REGENERATE_SECRET not configured')
        return new Response('Missing secret', { status: 500 })
    }

    const target = `${baseUrl.replace(/\/+$/, '')}/api/feeds/merchant/regenerate`

    try {
        const res = await fetch(target, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secret}`,
                'Content-Type': 'application/json',
                'User-Agent': 'midcar-cron/1.0',
            },
        })

        const body = await res.text()
        if (!res.ok) {
            console.error(`regenerate-feed: ${target} returned ${res.status}: ${body}`)
            return new Response(`Upstream ${res.status}`, { status: 502 })
        }

        console.log(`regenerate-feed: success — ${body}`)
        return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`regenerate-feed: fetch to ${target} threw:`, error)
        return new Response(`Cron failed: ${message}`, { status: 500 })
    }
}

export const config: Config = {
    schedule: '0 2 * * *',
}
