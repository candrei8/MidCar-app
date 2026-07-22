/**
 * Nombre comercial corto del vehículo para documentos (facturas, contratos…).
 *
 * El campo `modelo` del inventario suele traer la denominación completa del
 * anuncio ("Transit Connect Van 1.5 TDCi Trend 210 S&S TREND 100Cv"); en un
 * documento legal debe salir solo marca + modelo ("FORD TRANSIT CONNECT").
 * La heurística corta en el primer token que contenga dígitos (motorización,
 * potencia, año) o que sea una palabra de carrocería/acabado conocida.
 */

const STOP_WORDS = new Set([
    // Carrocería / configuración
    'VAN', 'FURGON', 'FURGÓN', 'KOMBI', 'COMBI', 'MIXTO', 'MIXTA', 'CHASIS',
    'CABINA', 'DOBLE', 'CORTO', 'LARGO', 'ISOTERMO', 'FRIGORIFICO', 'FRIGORÍFICO',
    // Motorizaciones
    'BLUEHDI', 'HDI', 'TDCI', 'TDI', 'TSI', 'TGI', 'DCI', 'CDTI', 'CRDI',
    'MJET', 'MULTIJET', 'ECOBLUE', 'ECOTEC', 'BLUETEC', 'CDI', 'JTD', 'GLP',
    'GNC', 'EV', 'HEV', 'PHEV',
    // Acabados habituales
    'PROFESIONAL', 'BUSINESS', 'TREND', 'AMBIENTE', 'TITANIUM', 'SPORTLINE',
    'CONFORT', 'COMFORT', 'PRO', 'PLUS', 'EXCLUSIVE', 'ACTIVE', 'STYLE',
    'LIFE', 'EDITION', 'PREMIUM', 'SELECT', 'ADVANCE', 'ELEGANCE'
])

const MAX_PALABRAS = 3

export function modeloCorto(modelo: string | undefined | null): string {
    const words = (modelo || '').trim().split(/\s+/).filter(Boolean)
    const out: string[] = []
    for (const w of words) {
        const uw = w.toUpperCase().replace(/[.,;:]/g, '')
        // La primera palabra siempre se conserva (hay modelos con dígitos: "308Sw")
        if (out.length > 0 && (/\d/.test(uw) || STOP_WORDS.has(uw))) break
        out.push(w)
        if (out.length >= MAX_PALABRAS) break
    }
    return out.join(' ')
}
