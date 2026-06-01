// Scheduled Netlify Function — pings the site's own build hook every morning
// to trigger a redeploy. The Next.js prebuild step then runs
// `scripts/build-merchant-feed.mjs`, refreshing the bundled feed XML.
//
// Setup once:
//   1. Netlify dashboard → Site settings → Build & deploy → Build hooks →
//      "Add build hook" (any name, branch=main). Copy the URL.
//   2. Site settings → Environment variables → `BUILD_HOOK_URL` = <URL>.
//
// Schedule is configured in netlify.toml.

export default async (request, context) => {
    const hook = process.env.BUILD_HOOK_URL
    if (!hook) {
        return new Response('BUILD_HOOK_URL env var is not set', { status: 500 })
    }
    const res = await fetch(hook, {
        method: 'POST',
        body: JSON.stringify({ trigger_title: 'daily merchant feed refresh' }),
    })
    if (!res.ok) {
        return new Response(`build hook returned HTTP ${res.status}`, { status: 500 })
    }
    return new Response('build triggered', { status: 200 })
}

export const config = {
    schedule: '0 3 * * *',
}
