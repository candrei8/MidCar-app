import { parseVehicleHtml } from '@/lib/midcar-net-scraper'

const HTML_FIAT = `<!DOCTYPE html><html><head>
    <meta property="og:locale" content="es_ES">
    <meta property="og:type" content="article">
    <meta property="og:title" content="Fiat Fiorino 1.3Mjet E6+ 80Cv segunda mano y ocasión Madrid | MIDCar">
    <meta property="og:description" content="Fiat Fiorino 1.3Mjet E6+ 80Cv de segunda mano en MIDCar. Tu concesionario de coches de ocasión en Madrid, Torrejón de Ardoz.">
    <meta name="description" content="Fallback description that should be ignored when og:description exists">
</head><body>
<img src="https://midcar.azureedge.net/vehiculos/0412175725166/photo-1-1500px.jpg">
<img src="https://midcar.azureedge.net/vehiculos/0412175725166/photo-2-1500px.jpg">
<img src="https://midcar.azureedge.net/vehiculos/0412175725166/photo-3-1500px.jpg">
<img src="https://midcar.azureedge.net/vehiculos/0412175725166/photo-1-1500px.jpg">
<img src="https://midcar.azureedge.net/vehiculos/9999999999999/another-vehicle-1.jpg">
</body></html>`

describe('parseVehicleHtml', () => {
    it('extracts og:description as the description', () => {
        const out = parseVehicleHtml(HTML_FIAT, '0412175725166')
        expect(out.description).toMatch(/^Fiat Fiorino 1\.3Mjet E6\+ 80Cv de segunda mano en MIDCar/)
    })

    it('falls back to <meta name="description"> when og:description is missing', () => {
        const html = `<html><head><meta name="description" content="Plain description"></head></html>`
        const out = parseVehicleHtml(html, 'abc')
        expect(out.description).toBe('Plain description')
    })

    it('returns empty description when neither tag is present', () => {
        const out = parseVehicleHtml('<html><head></head></html>', 'abc')
        expect(out.description).toBe('')
    })

    it('extracts only images under the matching vehicle id', () => {
        const out = parseVehicleHtml(HTML_FIAT, '0412175725166')
        expect(out.mainImage).toContain('/vehiculos/0412175725166/photo-1-1500px.jpg')
        expect(out.additionalImages.every(u => u.includes('/0412175725166/'))).toBe(true)
        // The image belonging to a different vehicle must not appear.
        expect(out.mainImage).not.toContain('9999999999999')
        expect(out.additionalImages.some(u => u.includes('9999999999999'))).toBe(false)
    })

    it('dedupes repeated image URLs', () => {
        const out = parseVehicleHtml(HTML_FIAT, '0412175725166')
        const allUrls = [out.mainImage, ...out.additionalImages].filter(Boolean) as string[]
        expect(new Set(allUrls).size).toBe(allUrls.length)
    })

    it('returns mainImage null and empty list when no matching images', () => {
        const out = parseVehicleHtml(HTML_FIAT, 'nonexistent-id')
        expect(out.mainImage).toBeNull()
        expect(out.additionalImages).toEqual([])
    })

    it('caps additional images at 10', () => {
        const head = `<html><head></head><body>`
        const imgs = Array.from({ length: 30 }, (_, i) =>
            `<img src="https://midcar.azureedge.net/vehiculos/MID-1/photo-${i}.jpg">`,
        ).join('\n')
        const out = parseVehicleHtml(head + imgs + '</body></html>', 'MID-1')
        expect(out.mainImage).toContain('photo-0.jpg')
        expect(out.additionalImages.length).toBe(10)
        expect(out.additionalImages[9]).toContain('photo-10.jpg')
    })

    it('decodes HTML entities in description', () => {
        const html = `<head><meta property="og:description" content="Tom &amp; Jerry &quot;quoted&quot; &lt;&gt;"></head>`
        const out = parseVehicleHtml(html, 'x')
        expect(out.description).toBe('Tom & Jerry "quoted" <>')
    })

    it('escapes regex-special chars in the vehicle id', () => {
        const html = `<img src="https://midcar.azureedge.net/vehiculos/abc.def/photo.jpg">`
                   + `<img src="https://midcar.azureedge.net/vehiculos/abcXdef/photo.jpg">`
        const out = parseVehicleHtml(html, 'abc.def')
        expect(out.mainImage).toContain('/abc.def/')
        // Must NOT match `abcXdef` even though `.` in regex would match any char.
        const all = [out.mainImage, ...out.additionalImages].filter(Boolean) as string[]
        expect(all.some(u => u.includes('abcXdef'))).toBe(false)
    })
})
