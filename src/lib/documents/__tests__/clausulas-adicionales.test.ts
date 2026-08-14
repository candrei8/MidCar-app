import { parseClausulasAdicionales, ordinalClausula } from '../clauses/clausulas-adicionales'
import { CompraventaTemplate } from '../templates/compraventa-template'
import { SenalTemplate } from '../templates/senal-template'
import { CLAUSULAS_COMPRAVENTA } from '../clauses/compraventa-clauses'
import { CLAUSULAS_SENAL } from '../clauses/senal-clauses'
import type { CompraventaData, SenalData, CustomerData, VehicleDocumentData } from '../document-types'

const cliente = (nombre: string): CustomerData => ({
    nombre,
    apellidos: 'De Prueba',
    dni: '12345678Z',
    direccion: 'Calle Falsa 1',
    codigoPostal: '28850',
    localidad: 'Torrejón de Ardoz',
    provincia: 'Madrid',
    telefono: '600000000',
    email: 'test@example.com',
})

const vehiculo: VehicleDocumentData = {
    id: 'veh-1',
    marca: 'Toyota',
    modelo: 'Corolla',
    matricula: '1234ABC',
    bastidor: 'VF1234567890',
    fechaMatriculacion: '2023-01-15',
    kilometros: 100000,
    combustible: 'hibrido',
}

// El contenido del PDF sin comprimir lleva el texto en operadores "(...) Tj"
function textoDelPdf(dataUri: string): string {
    const base64 = dataUri.split(',')[1]
    return Buffer.from(base64, 'base64').toString('latin1')
}

describe('parseClausulasAdicionales', () => {
    it('devuelve vacío si no hay texto', () => {
        expect(parseClausulasAdicionales('')).toEqual([])
        expect(parseClausulasAdicionales(null)).toEqual([])
        expect(parseClausulasAdicionales('   \n  ')).toEqual([])
    })

    it('trata cada línea como una cláusula', () => {
        expect(parseClausulasAdicionales('Primera cosa\nSegunda cosa'))
            .toEqual(['Primera cosa', 'Segunda cosa'])
    })

    it('respeta cláusulas de varias líneas separadas por línea en blanco', () => {
        const texto = 'Cláusula larga\ncon continuación\n\nOtra cláusula'
        expect(parseClausulasAdicionales(texto))
            .toEqual(['Cláusula larga\ncon continuación', 'Otra cláusula'])
    })

    it('numera continuando la serie de ordinales', () => {
        expect(ordinalClausula(0)).toBe('PRIMERA')
        expect(ordinalClausula(CLAUSULAS_COMPRAVENTA.length)).toBe('DUODÉCIMA')
        expect(ordinalClausula(CLAUSULAS_SENAL.length)).toBe('SEXTA')
    })
})

describe('cláusulas adicionales en el PDF', () => {
    const datosCompraventa = (clausulasAdicionales?: string): CompraventaData => ({
        vehiculo,
        vendedor: cliente('MIDCAR'),
        comprador: cliente('Comprador'),
        condiciones: {
            precioVenta: 12100,
            baseImponible: 10000,
            ivaPercent: 21,
            ivaImporte: 2100,
            totalConIva: 12100,
            formaPago: 'transferencia',
        },
        garantia: { meses: 12, kilometros: 20000 },
        fechaEntrega: '2026-08-12',
        lugarEntrega: 'Torrejón de Ardoz',
        accesorios: { ruedaRepuesto: true, gato: true, llavesRepuesto: true, manuales: true },
        documentacion: { fichaInspeccionTecnica: true, permisoCirculacion: true, ultimoReciboPagado: true },
        fechaContrato: '2026-08-12',
        lugarContrato: 'Torrejón de Ardoz',
        clausulasAdicionales,
    })

    it('imprime la cláusula escrita a mano en el contrato de compraventa', () => {
        const plantilla = new CompraventaTemplate(datosCompraventa('El vendedor entregara dos juegos de llaves'))
        plantilla.generate()
        const pdf = textoDelPdf(plantilla.getDataUrl())

        expect(pdf).toContain('El vendedor entregara dos juegos de llaves')
        // El acento de DUODÉCIMA se escapa en el stream del PDF
        expect(pdf).toMatch(/DUOD.{1,6}CIMA/)
    })

    it('no añade nada al contrato si no se escribe ninguna cláusula', () => {
        const plantilla = new CompraventaTemplate(datosCompraventa())
        plantilla.generate()
        expect(textoDelPdf(plantilla.getDataUrl())).not.toMatch(/DUOD.{1,6}CIMA/)
    })

    it('imprime la cláusula escrita a mano en el contrato de señal', () => {
        const datos: SenalData = {
            vehiculo,
            vendedor: cliente('MIDCAR'),
            comprador: cliente('Comprador'),
            importeSenal: 500,
            precioTotal: 12100,
            cuentaBancaria: 'ES00 0000 0000 0000',
            fechaSenal: '2026-08-12',
            fechaLimiteVenta: '2026-08-30',
            fechaContrato: '2026-08-12',
            lugarContrato: 'Torrejón de Ardoz',
            clausulasAdicionales: 'Reserva condicionada a la aprobacion de la financiacion',
        }
        const plantilla = new SenalTemplate(datos)
        plantilla.generate()
        const pdf = textoDelPdf(plantilla.getDataUrl())

        expect(pdf).toContain('Reserva condicionada a la aprobacion de la financiacion')
        expect(pdf).toContain('SEXTA')
    })
})
