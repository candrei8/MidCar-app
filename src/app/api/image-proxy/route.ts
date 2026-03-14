import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy de imágenes para evitar restricciones CORS al generar PDFs.
 * Permite URLs del CDN de Azure y de Supabase Storage.
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
        return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
    }

    // Validar que la URL sea de un origen permitido
    try {
        const parsed = new URL(url)
        const isAllowed =
            parsed.hostname.endsWith('azureedge.net') ||
            parsed.hostname.endsWith('blob.core.windows.net') ||
            parsed.hostname.endsWith('supabase.co')
        if (!isAllowed) {
            return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    try {
        const response = await fetch(url)

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const buffer = await response.arrayBuffer()

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }
}
