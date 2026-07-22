import { modeloCorto } from '../vehicle-name'

describe('modeloCorto', () => {
    it('corta la versión y motorización de modelos largos reales del inventario', () => {
        expect(modeloCorto('Transit Connect Van 1.5 TDCi Trend 210 S&S TREND 100Cv')).toBe('Transit Connect')
        expect(modeloCorto('Transit Courier  Van 1.5 TDCi  Trend 210  S&S TREND 100Cv')).toBe('Transit Courier')
        expect(modeloCorto('Fiorino 1.3Mjet E6+ 80Cv IVA y garantía Incl Etiqueta C')).toBe('Fiorino')
        expect(modeloCorto('Caddy Profesional Kombi 1.4 TGI/ GNC  BM 4 Puertas 110Cv')).toBe('Caddy')
        expect(modeloCorto('Partner Furgón Confort L2 1.6BlueHDI 100Cv')).toBe('Partner')
    })

    it('conserva la primera palabra aunque tenga dígitos', () => {
        expect(modeloCorto('308Sw  BlueHDi')).toBe('308Sw')
        expect(modeloCorto('208 GT Line')).toBe('208 GT Line')
    })

    it('limita a tres palabras', () => {
        expect(modeloCorto('Grand California Ocean Camper Especial')).toBe('Grand California Ocean')
    })

    it('tolera valores vacíos', () => {
        expect(modeloCorto('')).toBe('')
        expect(modeloCorto(undefined)).toBe('')
        expect(modeloCorto(null)).toBe('')
    })
})
