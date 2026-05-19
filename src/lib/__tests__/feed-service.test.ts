/**
 * Unit tests for the pure helpers in feed-service.ts.
 * No Supabase calls are exercised here; `buildMerchantFeed` is covered by
 * an integration-style test that mocks the `supabase` import.
 */

import {
    escapeXml,
    wrapCdata,
    sanitizeText,
    formatPrice,
    buildItemSlug,
    buildItemTitle,
    buildItemLink,
    buildItemDescription,
    feedExclusionReasons,
    isEligibleForFeed,
    serializeItem,
    buildFeedXml,
    resolveSiteUrl,
    FEED_CHANNEL_META,
    MAX_TITLE_LENGTH,
    type VehicleFeedInput,
} from '@/lib/feed-service'

const sampleVehicle: VehicleFeedInput = {
    id: 'uuid-1',
    stock_id: 'MC-0001',
    matricula: '1234 ABC',
    vin: 'WVWZZZ1KZAW123456',
    estado: 'disponible',
    incluir_en_feed: true,
    marca: 'Volkswagen',
    modelo: 'Golf',
    version: '1.6 TDI Comfortline',
    año_matriculacion: 2019,
    año_fabricacion: 2019,
    tipo_motor: '1.6 TDI',
    cilindrada: 1598,
    potencia_cv: 115,
    combustible: 'diesel',
    transmision: 'manual',
    etiqueta_dgt: 'C',
    color_exterior: 'gris',
    kilometraje: 85000,
    num_propietarios: 1,
    garantia_meses: 12,
    precio_venta: 15990,
    descuento: 0,
    imagen_principal: 'https://cdn.midcar.es/golf-1.jpg',
    imagenes: [
        { url: 'https://cdn.midcar.es/golf-1.jpg', es_principal: true, orden: 0 },
        { url: 'https://cdn.midcar.es/golf-2.jpg', orden: 1 },
        { url: 'https://cdn.midcar.es/golf-3.jpg', orden: 2 },
    ],
    descripcion: '',
    url_web: 'https://midcar.es/coches/volkswagen-golf-2019',
}

// ---------------------------------------------------------------------------
// escapeXml
// ---------------------------------------------------------------------------
describe('escapeXml', () => {
    it('escapes the five XML entities', () => {
        expect(escapeXml(`Tom & Jerry <"'>`)).toBe('Tom &amp; Jerry &lt;&quot;&apos;&gt;')
    })

    it('returns empty string for null/undefined', () => {
        expect(escapeXml(null as unknown as string)).toBe('')
        expect(escapeXml(undefined as unknown as string)).toBe('')
    })

    it('leaves safe characters untouched', () => {
        expect(escapeXml('Volkswagen Golf 1.6 TDI')).toBe('Volkswagen Golf 1.6 TDI')
    })
})

// ---------------------------------------------------------------------------
// wrapCdata
// ---------------------------------------------------------------------------
describe('wrapCdata', () => {
    it('wraps text in CDATA', () => {
        expect(wrapCdata('hola')).toBe('<![CDATA[hola]]>')
    })

    it('splits ]]> to avoid premature CDATA close', () => {
        const out = wrapCdata('foo]]>bar')
        expect(out).toBe('<![CDATA[foo]]]]><![CDATA[>bar]]>')
        expect(out).not.toMatch(/[^\]]\]\]>[^\]]/)
    })

    it('handles null gracefully', () => {
        expect(wrapCdata(null as unknown as string)).toBe('<![CDATA[]]>')
    })
})

// ---------------------------------------------------------------------------
// sanitizeText
// ---------------------------------------------------------------------------
describe('sanitizeText', () => {
    it('strips HTML tags', () => {
        expect(sanitizeText('<p>Hola <b>mundo</b></p>')).toBe('Hola mundo')
    })

    it('collapses whitespace and strips control chars', () => {
        // Control chars are removed silently (no space inserted), whitespace runs collapse to one space.
        expect(sanitizeText('foo\n\t  bar\x01baz')).toBe('foo barbaz')
        expect(sanitizeText('a   b\t\tc')).toBe('a b c')
    })

    it('returns empty for falsy input', () => {
        expect(sanitizeText('')).toBe('')
        expect(sanitizeText(null as unknown as string)).toBe('')
    })
})

// ---------------------------------------------------------------------------
// formatPrice
// ---------------------------------------------------------------------------
describe('formatPrice', () => {
    it('formats with two decimals and EUR suffix', () => {
        expect(formatPrice(15990)).toBe('15990.00 EUR')
        expect(formatPrice(15990.5)).toBe('15990.50 EUR')
        expect(formatPrice(0.1 + 0.2)).toBe('0.30 EUR')
    })

    it('handles invalid input', () => {
        expect(formatPrice(NaN)).toBe('0.00 EUR')
        expect(formatPrice(undefined as unknown as number)).toBe('0.00 EUR')
    })
})

// ---------------------------------------------------------------------------
// buildItemSlug
// ---------------------------------------------------------------------------
describe('buildItemSlug', () => {
    it('builds a kebab-case slug', () => {
        expect(buildItemSlug({
            marca: 'Volkswagen',
            modelo: 'Golf',
            año_matriculacion: 2019,
            stock_id: 'MC-0001',
        })).toBe('volkswagen-golf-2019-mc-0001')
    })

    it('strips accents and special chars', () => {
        expect(buildItemSlug({
            marca: 'Citroën',
            modelo: 'C4 Picasso',
            año_matriculacion: 2020,
            stock_id: 'MC/0002',
        })).toBe('citroen-c4-picasso-2020-mc-0002')
    })
})

// ---------------------------------------------------------------------------
// buildItemTitle
// ---------------------------------------------------------------------------
describe('buildItemTitle', () => {
    it('concatenates marca/modelo/año/version', () => {
        expect(buildItemTitle(sampleVehicle)).toBe('Volkswagen Golf 2019 1.6 TDI Comfortline')
    })

    it('omits falsy parts', () => {
        expect(buildItemTitle({ ...sampleVehicle, version: null, año_matriculacion: null })).toBe('Volkswagen Golf')
    })

    it(`truncates to ${MAX_TITLE_LENGTH} chars`, () => {
        const v = { ...sampleVehicle, version: 'X'.repeat(300) }
        const title = buildItemTitle(v)
        expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
        expect(title.endsWith('...')).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// buildItemLink
// ---------------------------------------------------------------------------
describe('buildItemLink', () => {
    it('uses url_web when present and HTTPS', () => {
        expect(buildItemLink(sampleVehicle, 'https://midcar.es'))
            .toBe('https://midcar.es/coches/volkswagen-golf-2019')
    })

    it('falls back to /vehiculos/{matricula} when url_web is missing', () => {
        expect(buildItemLink({ ...sampleVehicle, url_web: null }, 'https://midcar.es'))
            .toBe('https://midcar.es/vehiculos/1234ABC')
    })

    it('strips spaces and uppercases the matricula in the fallback', () => {
        expect(buildItemLink({ ...sampleVehicle, url_web: null, matricula: '  9876 xyz ' }, 'https://midcar.es'))
            .toBe('https://midcar.es/vehiculos/9876XYZ')
    })

    it('falls back to slug when both url_web and matricula are missing', () => {
        expect(buildItemLink({ ...sampleVehicle, url_web: null, matricula: null }, 'https://midcar.es'))
            .toBe('https://midcar.es/vehiculos/volkswagen-golf-2019-mc-0001')
    })

    it('ignores non-http url_web', () => {
        expect(buildItemLink({ ...sampleVehicle, url_web: 'javascript:alert(1)' }, 'https://midcar.es'))
            .toBe('https://midcar.es/vehiculos/1234ABC')
    })

    it('strips trailing slashes from siteUrl', () => {
        expect(buildItemLink({ ...sampleVehicle, url_web: null }, 'https://midcar.es///'))
            .toBe('https://midcar.es/vehiculos/1234ABC')
    })
})

// ---------------------------------------------------------------------------
// buildItemDescription
// ---------------------------------------------------------------------------
describe('buildItemDescription', () => {
    it('uses the provided description if long enough', () => {
        const long = 'A'.repeat(80)
        expect(buildItemDescription({ ...sampleVehicle, descripcion: long })).toBe(long)
    })

    it('autogenerates when description is empty', () => {
        const desc = buildItemDescription(sampleVehicle)
        expect(desc).toContain('Volkswagen')
        expect(desc).toContain('Golf')
        expect(desc).toContain('2019')
        expect(desc).toContain('CV')
        expect(desc).toContain('km')
        expect(desc).toContain('MidCar')
        expect(desc.length).toBeGreaterThan(80)
    })

    it('autogenerates when description is too short', () => {
        const desc = buildItemDescription({ ...sampleVehicle, descripcion: 'Hola' })
        expect(desc).toContain('Volkswagen')
    })

    it('strips HTML from the provided description', () => {
        const desc = buildItemDescription({
            ...sampleVehicle,
            descripcion: '<p>Coche <b>impecable</b> con muchos extras y un solo propietario, ITV recién pasada.</p>'
        })
        expect(desc).not.toMatch(/<[^>]+>/)
        expect(desc).toContain('impecable')
    })

    it('handles missing fields gracefully', () => {
        const desc = buildItemDescription({
            id: 'x', stock_id: 'X', estado: 'disponible',
            marca: 'Fiat', modelo: '500', precio_venta: 5000,
        })
        expect(desc).toContain('Fiat 500')
        expect(desc).toContain('MidCar')
    })
})

// ---------------------------------------------------------------------------
// feedExclusionReasons / isEligibleForFeed
// ---------------------------------------------------------------------------
describe('feedExclusionReasons', () => {
    it('returns empty for an eligible vehicle', () => {
        expect(feedExclusionReasons(sampleVehicle)).toEqual([])
        expect(isEligibleForFeed(sampleVehicle)).toBe(true)
    })

    it('flags vendido vehicles', () => {
        const reasons = feedExclusionReasons({ ...sampleVehicle, estado: 'vendido' })
        expect(reasons.length).toBeGreaterThan(0)
        expect(reasons.join(' ')).toContain('vendido')
    })

    it('flags missing price', () => {
        expect(feedExclusionReasons({ ...sampleVehicle, precio_venta: 0 }))
            .toEqual(['sin precio de venta'])
    })

    it('flags missing imagen_principal', () => {
        expect(feedExclusionReasons({ ...sampleVehicle, imagen_principal: null }))
            .toEqual(['sin imagen principal HTTPS válida'])
    })

    it('flags opted-out vehicles', () => {
        expect(feedExclusionReasons({ ...sampleVehicle, incluir_en_feed: false }))
            .toEqual(['marcado como excluido del feed'])
    })

    it('allows reservado (out_of_stock)', () => {
        expect(isEligibleForFeed({ ...sampleVehicle, estado: 'reservado' })).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// serializeItem
// ---------------------------------------------------------------------------
describe('serializeItem', () => {
    const siteUrl = 'https://midcar.es'

    it('emits all required Google Merchant fields', () => {
        const xml = serializeItem(sampleVehicle, siteUrl)
        expect(xml).toContain('<g:id>MC-0001</g:id>')
        expect(xml).toContain('<g:brand>')
        expect(xml).toContain('<g:condition>used</g:condition>')
        expect(xml).toContain('<g:availability>in_stock</g:availability>')
        expect(xml).toContain('<g:price>15990.00 EUR</g:price>')
        expect(xml).toContain('<g:image_link>https://cdn.midcar.es/golf-1.jpg</g:image_link>')
        expect(xml).toContain('<g:mpn>WVWZZZ1KZAW123456</g:mpn>')
        expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>')
        expect(xml).toContain('<title><![CDATA[Volkswagen Golf 2019 1.6 TDI Comfortline]]></title>')
        // sampleVehicle has url_web set, which takes priority over the matricula fallback.
        expect(xml).toContain('<link>https://midcar.es/coches/volkswagen-golf-2019</link>')
    })

    it('emits g:sale_price when descuento > 0', () => {
        const xml = serializeItem({ ...sampleVehicle, descuento: 1000 }, siteUrl)
        expect(xml).toContain('<g:price>15990.00 EUR</g:price>')
        expect(xml).toContain('<g:sale_price>14990.00 EUR</g:sale_price>')
    })

    it('omits g:sale_price when descuento is 0', () => {
        const xml = serializeItem(sampleVehicle, siteUrl)
        expect(xml).not.toContain('g:sale_price')
    })

    it('marks reservado vehicles as out_of_stock', () => {
        const xml = serializeItem({ ...sampleVehicle, estado: 'reservado' }, siteUrl)
        expect(xml).toContain('<g:availability>out_of_stock</g:availability>')
    })

    it('emits additional images excluding the main one and capping at 10', () => {
        const xml = serializeItem(sampleVehicle, siteUrl)
        const matches = xml.match(/<g:additional_image_link>/g) || []
        expect(matches.length).toBe(2)
        expect(xml).toContain('golf-2.jpg')
        expect(xml).toContain('golf-3.jpg')
    })

    it('caps additional images at 10', () => {
        const many = Array.from({ length: 25 }, (_, i) => ({
            url: `https://cdn.midcar.es/extra-${i}.jpg`,
        }))
        const xml = serializeItem({ ...sampleVehicle, imagenes: many }, siteUrl)
        const matches = xml.match(/<g:additional_image_link>/g) || []
        expect(matches.length).toBe(10)
    })

    it('falls back to stock_id as mpn when vin is missing', () => {
        const xml = serializeItem({ ...sampleVehicle, vin: null }, siteUrl)
        expect(xml).toContain('<g:mpn>MC-0001</g:mpn>')
    })

    it('escapes ampersands in URLs', () => {
        const xml = serializeItem({
            ...sampleVehicle,
            url_web: 'https://midcar.es/coche?id=1&ref=facebook',
        }, siteUrl)
        expect(xml).toContain('<link>https://midcar.es/coche?id=1&amp;ref=facebook</link>')
    })
})

// ---------------------------------------------------------------------------
// buildFeedXml
// ---------------------------------------------------------------------------
describe('buildFeedXml', () => {
    it('produces well-formed RSS with channel meta', () => {
        const xml = buildFeedXml([], FEED_CHANNEL_META)
        expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/)
        expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"')
        expect(xml).toContain('<channel>')
        expect(xml).toContain('</channel>')
        expect(xml).toContain('</rss>')
    })

    it('embeds items', () => {
        const items = [serializeItem(sampleVehicle, 'https://midcar.es')]
        const xml = buildFeedXml(items)
        expect(xml).toContain('<g:id>MC-0001</g:id>')
        expect((xml.match(/<item>/g) || []).length).toBe(1)
    })

    it('survives an empty item list', () => {
        const xml = buildFeedXml([])
        expect(xml).not.toContain('<item>')
        expect(xml).toContain('</channel>')
    })
})

// ---------------------------------------------------------------------------
// resolveSiteUrl
// ---------------------------------------------------------------------------
describe('resolveSiteUrl', () => {
    const original = { SITE_URL: process.env.SITE_URL, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }

    afterEach(() => {
        process.env.SITE_URL = original.SITE_URL
        process.env.NEXT_PUBLIC_SITE_URL = original.NEXT_PUBLIC_SITE_URL
    })

    it('prefers explicit override', () => {
        expect(resolveSiteUrl('https://example.com/')).toBe('https://example.com')
    })

    it('uses SITE_URL env when no override', () => {
        process.env.SITE_URL = 'https://midcar.test'
        delete process.env.NEXT_PUBLIC_SITE_URL
        expect(resolveSiteUrl()).toBe('https://midcar.test')
    })

    it('falls back to channel default when nothing is set', () => {
        delete process.env.SITE_URL
        delete process.env.NEXT_PUBLIC_SITE_URL
        expect(resolveSiteUrl()).toBe(FEED_CHANNEL_META.link)
    })
})

// ---------------------------------------------------------------------------
// XML well-formedness smoke test (very lightweight, no parser dependency)
// ---------------------------------------------------------------------------
describe('XML structural sanity', () => {
    it('tag count balances for a typical feed', () => {
        const xml = buildFeedXml([
            serializeItem(sampleVehicle, 'https://midcar.es'),
            serializeItem({ ...sampleVehicle, stock_id: 'MC-0002', descuento: 500 }, 'https://midcar.es'),
        ])
        const opens = (xml.match(/<item>/g) || []).length
        const closes = (xml.match(/<\/item>/g) || []).length
        expect(opens).toBe(2)
        expect(opens).toBe(closes)
        // No accidental double xml declaration
        expect((xml.match(/<\?xml/g) || []).length).toBe(1)
        // Encoding is UTF-8 and no BOM (string starts with '<')
        expect(xml.charCodeAt(0)).toBe(0x3c)
    })
})
