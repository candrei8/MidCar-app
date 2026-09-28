import {
    antiguedadStock, buildVentas, calcularKpis, candidatosRebaja, getRangoPeriodo, mix,
    rankingMargen, serieMensual, vencimientos,
} from '../dashboard-metrics'
import type { Vehicle } from '@/types'

const NOW = new Date(2026, 8, 28, 10, 0) // 28 sep 2026

function car(overrides: Partial<Vehicle>): Vehicle {
    return {
        id: Math.random().toString(36).slice(2),
        marca: 'Seat',
        modelo: 'León',
        matricula: '1234ABC',
        estado: 'disponible',
        combustible: 'gasolina',
        precio_compra: 10000,
        gastos_compra: 0,
        coste_reparaciones: 0,
        precio_venta: 12000,
        descuento: 0,
        fecha_entrada_stock: '2026-09-01',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-09-10T12:00:00Z',
        ...overrides,
    } as Vehicle
}

describe('getRangoPeriodo', () => {
    it('compara el mes en curso con los mismos días del mes anterior', () => {
        const r = getRangoPeriodo('mes', NOW)
        expect(r.desde).toEqual(new Date(2026, 8, 1))
        expect(r.hasta).toEqual(new Date(2026, 8, 29))
        expect(r.prevDesde).toEqual(new Date(2026, 7, 1))
        expect(r.prevHasta).toEqual(new Date(2026, 7, 29))
        expect(r.comparacion).toBe('vs mismos días de agosto')
    })

    it('no desborda en meses cortos (31 de marzo → hasta el 28 de febrero)', () => {
        const r = getRangoPeriodo('mes', new Date(2026, 2, 31))
        expect(r.prevHasta).toEqual(new Date(2026, 2, 1))
    })

    it('el año compara con el mismo tramo del año anterior', () => {
        const r = getRangoPeriodo('anio', NOW)
        expect(r.desde).toEqual(new Date(2026, 0, 1))
        expect(r.prevDesde).toEqual(new Date(2025, 0, 1))
        expect(r.prevHasta).toEqual(new Date(2025, 8, 29))
    })
})

describe('buildVentas', () => {
    it('resta el descuento del precio de venta', () => {
        const v = car({ estado: 'vendido', precio_venta: 15000, descuento: 1000, precio_compra: 11000 })
        const [venta] = buildVentas([v], [], [])
        expect(venta.precio).toBe(14000)
        expect(venta.margen).toBe(3000)
    })

    it('no inventa margen cuando falta el precio de compra', () => {
        const v = car({ estado: 'vendido', precio_compra: 0 })
        const [venta] = buildVentas([v], [], [])
        expect(venta.coste).toBeNull()
        expect(venta.margen).toBeNull()
    })

    it('prefiere la fecha y el precio del contrato firmado', () => {
        const v = car({ id: 'v1', estado: 'vendido', precio_venta: 15000 })
        const [venta] = buildVentas([v], [{ vehiculo_id: 'v1', estado: 'firmado', fecha_firma: '2026-07-15', precio_venta: 14500 }], [])
        expect(venta.origenFecha).toBe('contrato')
        expect(venta.fecha).toEqual(new Date(2026, 6, 15))
        expect(venta.precio).toBe(14500)
    })

    it('ignora contratos en borrador y marca la fecha como aproximada', () => {
        const v = car({ id: 'v1', estado: 'vendido' })
        const [venta] = buildVentas([v], [{ vehiculo_id: 'v1', estado: 'borrador', fecha_firma: '2026-07-15', precio_venta: 1 }], [])
        expect(venta.origenFecha).toBe('aprox')
    })
})

describe('calcularKpis', () => {
    const vehicles = [
        car({ estado: 'vendido', updated_at: '2026-09-10T12:00:00Z', precio_compra: 10000, precio_venta: 12000 }),
        car({ estado: 'vendido', updated_at: '2026-09-12T12:00:00Z', precio_compra: 0, precio_venta: 9000 }),
        car({ estado: 'vendido', updated_at: '2026-08-05T12:00:00Z', precio_compra: 10000, precio_venta: 11000 }),
        car({ estado: 'disponible', fecha_entrada_stock: '2026-05-01', precio_compra: 8000, precio_venta: 10000 }),
        car({ estado: 'reservado', fecha_entrada_stock: '2026-09-18', precio_compra: 0, precio_venta: 7000 }),
    ]
    const ventas = buildVentas(vehicles, [], [])
    const k = calcularKpis(vehicles, ventas, getRangoPeriodo('mes', NOW), NOW)

    it('cuenta ventas e ingresos del periodo y del anterior', () => {
        expect(k.vendidos.actual).toBe(2)
        expect(k.vendidos.anterior).toBe(1)
        expect(k.vendidos.delta).toBe(100)
        expect(k.ingresos.actual).toBe(21000)
    })

    it('el margen solo incluye ventas con coste conocido', () => {
        expect(k.margen.actual).toBe(2000)
        expect(k.ventasSinCoste).toBe(1)
        expect(k.margenPct).toBeCloseTo((2000 / 12000) * 100)
    })

    it('el stock suma coste solo de coches con precio de compra', () => {
        expect(k.stockUnidades).toBe(2)
        expect(k.stockCoste).toBe(8000)
        expect(k.stockSinCoste).toBe(1)
        expect(k.stockMargenPotencial).toBe(2000)
        expect(k.parados).toBe(1)
    })

    it('sin periodo anterior no hay delta inventado', () => {
        const solo = [car({ estado: 'vendido', updated_at: '2026-09-10T12:00:00Z' })]
        const kk = calcularKpis(solo, buildVentas(solo, [], []), getRangoPeriodo('mes', NOW), NOW)
        expect(kk.vendidos.delta).toBeNull()
    })
})

describe('stock', () => {
    const vehicles = [
        car({ fecha_entrada_stock: '2026-09-20' }), // 8 días
        car({ fecha_entrada_stock: '2026-06-01' }), // 119 días
        car({ fecha_entrada_stock: '2026-01-01' }), // 270 días
        car({ estado: 'vendido', fecha_entrada_stock: '2025-01-01' }),
    ]

    it('reparte el stock por tramos de antigüedad', () => {
        const t = antiguedadStock(vehicles, NOW)
        expect(t.map(x => x.unidades)).toEqual([1, 0, 0, 1, 1])
    })

    it('propone rebajar los disponibles de más de 75 días, del más antiguo al más nuevo', () => {
        const c = candidatosRebaja(vehicles, NOW)
        expect(c.map(x => x.dias)).toEqual([270, 119])
    })
})

describe('rankingMargen y mix', () => {
    const vehicles = Array.from({ length: 12 }, (_, i) => car({
        estado: 'vendido', marca: i < 8 ? 'Seat' : 'Kia', precio_venta: 10000 + i * 500, precio_compra: 10000,
        updated_at: '2026-09-10T12:00:00Z',
    }))
    const ventas = buildVentas(vehicles, [], [])
    const rango = getRangoPeriodo('mes', NOW)

    it('separa los 5 mejores y los 5 peores cuando hay más de 10', () => {
        const r = rankingMargen(ventas, rango)
        expect(r.mejores[0].margen).toBe(5500)
        expect(r.peores[r.peores.length - 1].margen).toBe(0)
    })

    it('calcula el reparto de ventas por marca en %', () => {
        const filas = mix(vehicles, ventas, rango, 'marca')
        const seat = filas.find(f => f.key === 'SEAT')!
        expect(seat.ventas).toBe(8)
        expect(seat.ventasPct).toBeCloseTo((8 / 12) * 100)
    })
})

describe('serieMensual', () => {
    it('devuelve 12 meses aunque no haya ventas en todos', () => {
        const s = serieMensual([], NOW)
        expect(s).toHaveLength(12)
        expect(s[11].key).toBe('2026-09')
    })
})

describe('vencimientos', () => {
    it('incluye ITV del stock y cosas vencidas, y descarta lo que queda lejos', () => {
        const vehicles = [
            car({ id: 'a', fecha_itv_vencimiento: '2026-09-20' }),
            car({ id: 'b', fecha_itv_vencimiento: '2027-05-01' }),
            car({ id: 'c', estado: 'vendido', fecha_itv_vencimiento: '2026-09-20' }),
        ]
        const out = vencimientos({
            vehicles,
            senales: [{ id: 's', vehiculo_id: 'a', vehiculo_marca: 'Seat', vehiculo_modelo: 'Ibiza', comprador_nombre: 'Ana', estado: 'activa', fecha_senal: '2026-09-01', fecha_limite_venta: '2026-10-02' }],
            polizas: [],
            facturas: [{ id: 'f', numero_factura: 'FA-1', vehiculo_id: null, cliente_nombre: 'X', estado: 'anulada', total: 1, fecha_vencimiento: '2026-09-01', created_at: '2026-08-01' }],
            tareas: [],
        }, NOW)
        expect(out.map(v => v.id)).toEqual(['itv-a', 'senal-s'])
        expect(out[0].dias).toBe(-8)
        expect(out[1].dias).toBe(4)
    })
})

describe('nombres', () => {
    const { nombreCoche } = jest.requireActual('@/components/dashboard/lists')

    it('usa la versión cuando el modelo viene truncado a una letra', () => {
        expect(nombreCoche({ marca: 'Ford', modelo: 'C', version: 'Custom Van 2.0 TDCI 130Cv' })).toBe('Ford Custom')
    })

    it('quita la marca repetida y el texto del anuncio', () => {
        expect(nombreCoche({ marca: 'Volkswagen', modelo: 'Vw Passat 2.0 TDI' })).toBe('Volkswagen Passat')
        expect(nombreCoche({ marca: 'Fiat', modelo: 'Fiorino 1.3Mjet E6+ 80Cv IVA y garantía' })).toBe('Fiat Fiorino')
    })

    it('agrupa marcas sin distinguir tildes', () => {
        const { normalizarMarca } = jest.requireActual('../dashboard-metrics')
        expect(normalizarMarca('Citroën')).toBe(normalizarMarca('Citroen'))
    })
})
