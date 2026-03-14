import { validateVIN, decodeVINBasic } from '@/lib/vin-decoder'

describe('VIN Decoder - validateVIN', () => {
    it('acepta VIN válido de 17 caracteres', () => {
        expect(validateVIN('WVWZZZ3CZWE123456')).toBe(true)
        expect(validateVIN('1HGBH41JXMN109186')).toBe(true)
    })

    it('rechaza VIN con caracteres no permitidos (I, O, Q)', () => {
        expect(validateVIN('WVWZZZ3CZWE12345I')).toBe(false) // I
        expect(validateVIN('WVWZZZ3CZWE12345O')).toBe(false) // O
        expect(validateVIN('WVWZZZ3CZWE12345Q')).toBe(false) // Q
    })

    it('rechaza VIN con longitud incorrecta', () => {
        expect(validateVIN('WVWZZZ3CZWE12345')).toBe(false) // 16 chars
        expect(validateVIN('WVWZZZ3CZWE1234567')).toBe(false) // 18 chars
        expect(validateVIN('')).toBe(false) // empty
    })

    it('rechaza VIN con caracteres especiales', () => {
        expect(validateVIN('WVWZZZ3CZWE1234-6')).toBe(false)
        expect(validateVIN('WVWZZZ3CZWE 23456')).toBe(false)
    })

    it('es case-insensitive', () => {
        expect(validateVIN('wvwzzz3czwe123456')).toBe(true)
        expect(validateVIN('WvWzZz3CzWe123456')).toBe(true)
    })
})

describe('VIN Decoder - decodeVINBasic', () => {
    it('decodifica fabricante Volkswagen', () => {
        const result = decodeVINBasic('WVWZZZ3CZWE123456')
        expect(result.manufacturer).toBe('Volkswagen')
    })

    it('decodifica fabricante BMW', () => {
        const result = decodeVINBasic('WBAPH5C55BA123456')
        expect(result.manufacturer).toBe('BMW')
    })

    it('decodifica fabricante Audi', () => {
        const result = decodeVINBasic('WAUZZZ8V5KA123456')
        expect(result.manufacturer).toBe('Audi')
    })

    it('decodifica fabricante SEAT', () => {
        const result = decodeVINBasic('VSSZZZAAZJD123456')
        expect(result.manufacturer).toBe('SEAT')
    })

    it('decodifica fabricante Mercedes-Benz', () => {
        const result = decodeVINBasic('WDBRF61J21F123456')
        expect(result.manufacturer).toBe('Mercedes-Benz')
    })

    it('decodifica año desde posición 10', () => {
        // L = 2020
        const result2020 = decodeVINBasic('WVWZZZ3CZLE123456')
        expect(result2020.year).toBe('2020')

        // N = 2022
        const result2022 = decodeVINBasic('WVWZZZ3CZNE123456')
        expect(result2022.year).toBe('2022')

        // P = 2023
        const result2023 = decodeVINBasic('WVWZZZ3CZPE123456')
        expect(result2023.year).toBe('2023')
    })

    it('maneja fabricante desconocido', () => {
        const result = decodeVINBasic('XXX123456789ABCDE')
        expect(result.manufacturer).toBe('Fabricante no identificado')
    })

    it('decodifica fabricantes españoles', () => {
        // Renault
        const renault = decodeVINBasic('VF1XXXXXXXXXXXXXX')
        expect(renault.manufacturer).toBe('Renault')

        // Peugeot
        const peugeot = decodeVINBasic('VF3XXXXXXXXXXXXXX')
        expect(peugeot.manufacturer).toBe('Peugeot')

        // Dacia
        const dacia = decodeVINBasic('UU1XXXXXXXXXXXXXX')
        expect(dacia.manufacturer).toBe('Dacia')
    })

    it('decodifica fabricantes japoneses', () => {
        const toyota = decodeVINBasic('JTDXXXXXXXXXXXXXX')
        expect(toyota.manufacturer).toBe('Toyota')

        const honda = decodeVINBasic('JHMXXXXXXXXXXXXXX')
        expect(honda.manufacturer).toBe('Honda')

        const nissan = decodeVINBasic('JN1XXXXXXXXXXXXXX')
        expect(nissan.manufacturer).toBe('Nissan')
    })
})
