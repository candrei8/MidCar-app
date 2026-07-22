/**
 * Tests del extractor de matrículas del PDF de la aseguradora.
 * Protegen contra los falsos positivos detectados en revisión: años + marca
 * (2015 BMW), pesos (3500 KGS), cilindradas (A 1800 CC) y prosa legal.
 */
import { findPlates, findPlatesLoose, findDates, detectAseguradora, scanPolicies } from '../insurancePdfParser'

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

describe('findPlatesLoose (texto de OCR)', () => {
    it('recupera errores típicos del OCR: O por cero y puntos/letras duplicadas', () => {
        // Líneas reales del OCR del listado de flota de AXA
        expect(findPlatesLoose('O553LWL VOLKSWAGEN')).toEqual(['0553LWL'])
        expect(findPlatesLoose('0444L.LGW VOLKSWAGEN')).toEqual(['0444LGW'])
    })

    it('mantiene las detecciones estrictas', () => {
        expect(findPlatesLoose('0198LXP CITROEN 0218KRT FORD')).toEqual(['0198LXP', '0218KRT'])
    })

    it('no inventa matrículas en texto normal', () => {
        expect(findPlatesLoose('AÑO 2015 BMW SERIE 3 PMA 3500 KGS')).toEqual([])
    })
})

describe('scanPolicies (líneas reales del listado AXA)', () => {
    const lineasReales = [
        'Póliza de Seguro AXA Automóvil',
        'Tomador: MID CAR SOLUCIONES SL',
        'Anexo a la Póliza número: 030-0047248350',
        'Relación de vehículos asegurados a 21/07/2026 17:57:26',
        'Matrícula Marca Matrícula Marca Matrícula Marca',
        '0198LXP CITROEN 0218KRT FORD 0444L.LGW VOLKSWAGEN',
        'O553LWL VOLKSWAGEN 0611JBZ VOLKSWAGEN 0797LSG VOLKSWAGEN'
    ]

    it('extrae todas las matrículas con el número de póliza global', () => {
        const { policies, aseguradora } = scanPolicies(lineasReales, findPlatesLoose)
        const matriculas = policies.map(p => p.matricula)
        expect(matriculas).toEqual(
            expect.arrayContaining(['0198LXP', '0218KRT', '0444LGW', '0553LWL', '0611JBZ', '0797LSG'])
        )
        expect(matriculas).toHaveLength(6)
        expect(aseguradora).toBe('Axa')
        // Número derivado de la póliza global, marcado como generado
        expect(policies[0].numeroPoliza).toBe('030-0047248350-0198LXP')
        expect(policies[0].numeroPolizaGenerado).toBe(true)
    })

    it('no confunde la fecha de la cabecera con matrículas', () => {
        const { policies } = scanPolicies(['Relación de vehículos asegurados a 21/07/2026 17:57:26'], findPlatesLoose)
        expect(policies).toHaveLength(0)
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
