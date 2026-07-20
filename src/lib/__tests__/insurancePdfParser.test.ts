/**
 * Tests del extractor de matrículas del PDF de la aseguradora.
 * Protegen contra los falsos positivos detectados en revisión: años + marca
 * (2015 BMW), pesos (3500 KGS), cilindradas (A 1800 CC) y prosa legal.
 */
import { findPlates, findDates, detectAseguradora } from '../insurancePdfParser'

describe('findPlates', () => {
    it('detecta matrículas formato nuevo (4 dígitos + 3 consonantes)', () => {
        expect(findPlates('MATRICULA 1306 KMV FURGON')).toEqual(['1306KMV'])
        expect(findPlates('1234 BCD Y 5678-FGH')).toEqual(['1234BCD', '5678FGH'])
        expect(findPlates('0412HYT')).toEqual(['0412HYT'])
    })

    it('detecta matrículas formato antiguo con guiones o compactas', () => {
        expect(findPlates('M-1234-AB PEUGEOT')).toEqual(['M1234AB'])
        expect(findPlates('SS1234BK ANTIGUO')).toEqual(['SS1234BK'])
    })

    it('rechaza años seguidos de marcas o siglas de motor', () => {
        expect(findPlates('AÑO 2015 BMW SERIE 3')).toEqual([])
        expect(findPlates('MODELO 2018 BMW X3')).toEqual([])
        expect(findPlates('AÑO 2021 KTM DUKE')).toEqual([])
        expect(findPlates('MOTOR 1.4 GLP 2020 GLP')).toEqual([])
    })

    it('rechaza pesos, unidades y prosa legal', () => {
        expect(findPlates('PMA 3500 KGS TARA 1500 KGS')).toEqual([])
        expect(findPlates('CLASE A 1800 CC')).toEqual([])
        expect(findPlates('PÓLIZA N 1234 EL VEHÍCULO')).toEqual([])
        expect(findPlates('AÑO 2024 SE APLICARÁ')).toEqual([])
    })

    it('rechaza formato antiguo con código provincial inexistente', () => {
        expect(findPlates('N-1234-EL')).toEqual([])
    })
})

describe('findDates', () => {
    it('convierte fechas dd/mm/aaaa a ISO', () => {
        expect(findDates('DESDE 01/02/2026 HASTA 31/01/2027')).toEqual(['2026-02-01', '2027-01-31'])
    })

    it('acepta años de dos dígitos', () => {
        expect(findDates('VENCE 15-08-26')).toEqual(['2026-08-15'])
    })

    it('descarta fechas imposibles', () => {
        expect(findDates('99/99/2026')).toEqual([])
    })
})

describe('detectAseguradora', () => {
    it('detecta compañías conocidas en el texto', () => {
        expect(detectAseguradora('CONDICIONES PARTICULARES AXA SEGUROS GENERALES')).toBe('Axa')
        expect(detectAseguradora('MAPFRE ESPAÑA S.A.')).toBe('Mapfre')
        expect(detectAseguradora('LINEA DIRECTA ASEGURADORA')).toBe('Línea Directa')
    })

    it('devuelve undefined si no hay compañía conocida', () => {
        expect(detectAseguradora('DOCUMENTO SIN COMPAÑIA')).toBeUndefined()
    })
})
