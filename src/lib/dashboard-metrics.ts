/**
 * Métricas del dashboard.
 *
 * Funciones puras: reciben los vehículos y documentos ya cargados y devuelven
 * lo que pinta el dashboard. Sin acceso a red para poder probarlas con Jest.
 */

import type { Vehicle } from '@/types'
import { modeloCorto } from './vehicle-name'

// ============================================================================
// UMBRALES
// ============================================================================

/** Días en stock a partir de los cuales un coche se considera "parado" */
export const DIAS_RIESGO = 90
/** Días a partir de los cuales se propone rebajar el precio */
export const DIAS_REBAJA = 75
/** Semáforo de días medios en stock */
export const DIAS_STOCK_OK = 45
export const DIAS_STOCK_AVISO = 75
/** Ventana de vencimientos */
export const DIAS_VENCIMIENTOS = 30

export const TRAMOS_ANTIGUEDAD = [
    { key: '0-30', label: '0–30 días', min: 0, max: 30 },
    { key: '31-60', label: '31–60 días', min: 31, max: 60 },
    { key: '61-90', label: '61–90 días', min: 61, max: 90 },
    { key: '91-120', label: '91–120 días', min: 91, max: 120 },
    { key: '120+', label: 'Más de 120', min: 121, max: Infinity },
] as const

export const RANGOS_PRECIO = [
    { key: '<10k', label: 'Menos de 10.000 €', min: 0, max: 10000 },
    { key: '10-15k', label: '10.000–15.000 €', min: 10000, max: 15000 },
    { key: '15-20k', label: '15.000–20.000 €', min: 15000, max: 20000 },
    { key: '20-30k', label: '20.000–30.000 €', min: 20000, max: 30000 },
    { key: '>30k', label: 'Más de 30.000 €', min: 30000, max: Infinity },
] as const

// ============================================================================
// TIPOS DE ENTRADA
// ============================================================================

export interface ContratoLite {
    vehiculo_id: string | null
    estado: string
    fecha_firma: string | null
    precio_venta: number | null
}

export interface FacturaLite {
    id: string
    numero_factura: string | null
    vehiculo_id: string | null
    cliente_nombre: string | null
    estado: string
    total: number | null
    fecha_vencimiento: string | null
    created_at: string
}

export interface SenalLite {
    id: string
    vehiculo_id: string | null
    vehiculo_marca: string | null
    vehiculo_modelo: string | null
    comprador_nombre: string | null
    estado: string
    fecha_senal: string | null
    fecha_limite_venta: string | null
}

export interface PolizaLite {
    id: string
    vehiculo_id: string | null
    vehiculo_matricula: string | null
    numero_poliza: string | null
    compania_aseguradora: string | null
    estado: string
    fecha_vencimiento: string | null
}

export interface TareaLite {
    id: string
    titulo: string
    fecha_vencimiento: string | null
    completada: boolean
}

// ============================================================================
// FECHAS
// ============================================================================

const DAY = 24 * 60 * 60 * 1000

/** Interpreta 'YYYY-MM-DD' como fecha local; los timestamps completos se respetan */
export function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number)
        return new Date(y, m - 1, d)
    }
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
}

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysBetween(from: Date, to: Date): number {
    return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)
}

export function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ============================================================================
// PERIODOS
// ============================================================================

export type Periodo = 'mes' | 'trimestre' | 'anio'

export const PERIODOS: { key: Periodo; label: string; corto: string }[] = [
    { key: 'mes', label: 'Este mes', corto: 'Mes' },
    { key: 'trimestre', label: 'Este trimestre', corto: 'Trimestre' },
    { key: 'anio', label: 'Este año', corto: 'Año' },
]

export function isPeriodo(value: string | null | undefined): value is Periodo {
    return value === 'mes' || value === 'trimestre' || value === 'anio'
}

export interface RangoPeriodo {
    desde: Date
    /** Exclusivo */
    hasta: Date
    prevDesde: Date
    prevHasta: Date
    /** Texto para la comparación, p. ej. "vs mismos días de agosto" */
    comparacion: string
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/**
 * Periodo actual (hasta hoy incluido) y el periodo anterior de la misma
 * duración, para que la comparación sea justa a mitad de mes o de año.
 */
export function getRangoPeriodo(periodo: Periodo, now: Date): RangoPeriodo {
    const hasta = new Date(startOfDay(now).getTime() + DAY)
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()

    // Resta meses sin desbordar (31 de marzo - 1 mes = 28/29 de febrero)
    const shiftMonths = (date: Date, months: number) => {
        const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
        const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
        return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay))
    }

    switch (periodo) {
        case 'mes': {
            const desde = new Date(y, m, 1)
            const prevDesde = new Date(y, m - 1, 1)
            const prevHasta = new Date(shiftMonths(new Date(y, m, d), -1).getTime() + DAY)
            return { desde, hasta, prevDesde, prevHasta, comparacion: `vs mismos días de ${MESES[(m + 11) % 12]}` }
        }
        case 'trimestre': {
            const q = Math.floor(m / 3) * 3
            const desde = new Date(y, q, 1)
            const prevDesde = new Date(y, q - 3, 1)
            const prevHasta = new Date(shiftMonths(new Date(y, m, d), -3).getTime() + DAY)
            return { desde, hasta, prevDesde, prevHasta, comparacion: 'vs trimestre anterior' }
        }
        case 'anio': {
            const desde = new Date(y, 0, 1)
            const prevDesde = new Date(y - 1, 0, 1)
            const prevHasta = new Date(shiftMonths(new Date(y, m, d), -12).getTime() + DAY)
            return { desde, hasta, prevDesde, prevHasta, comparacion: `vs mismo periodo de ${y - 1}` }
        }
    }
}

function inRange(d: Date, desde: Date, hasta: Date) {
    return d >= desde && d < hasta
}

// ============================================================================
// ECONOMÍA DE CADA COCHE
// ============================================================================

export function precioNeto(v: Pick<Vehicle, 'precio_venta' | 'descuento'>): number {
    return (v.precio_venta || 0) - (v.descuento || 0)
}

/** Coste total, o null si falta el precio de compra (no se puede calcular margen) */
export function costeTotal(v: Pick<Vehicle, 'precio_compra' | 'gastos_compra' | 'coste_reparaciones'>): number | null {
    if (!v.precio_compra || v.precio_compra <= 0) return null
    return v.precio_compra + (v.gastos_compra || 0) + (v.coste_reparaciones || 0)
}

export function diasEnStock(v: Pick<Vehicle, 'fecha_entrada_stock'>, now: Date): number {
    const entrada = parseDate(v.fecha_entrada_stock)
    return entrada ? Math.max(0, daysBetween(entrada, now)) : 0
}

export function enStock(v: Pick<Vehicle, 'estado'>): boolean {
    return v.estado === 'disponible' || v.estado === 'reservado'
}

// ============================================================================
// VENTAS
// ============================================================================

export type OrigenFecha = 'contrato' | 'factura' | 'aprox'

export interface Venta {
    vehicle: Vehicle
    fecha: Date
    origenFecha: OrigenFecha
    precio: number
    coste: number | null
    margen: number | null
}

/**
 * Cada coche vendido con su mejor fecha y precio disponibles:
 * contrato firmado → factura → última modificación del coche (aproximada).
 */
export function buildVentas(vehicles: Vehicle[], contratos: ContratoLite[], facturas: FacturaLite[]): Venta[] {
    const contratoPorCoche = new Map<string, ContratoLite>()
    for (const c of contratos) {
        if (!c.vehiculo_id || !c.fecha_firma) continue
        if (c.estado !== 'firmado' && c.estado !== 'entregado') continue
        const prev = contratoPorCoche.get(c.vehiculo_id)
        if (!prev || (prev.fecha_firma || '') < c.fecha_firma) contratoPorCoche.set(c.vehiculo_id, c)
    }
    const facturaPorCoche = new Map<string, FacturaLite>()
    for (const f of facturas) {
        if (!f.vehiculo_id || f.estado === 'anulada') continue
        const prev = facturaPorCoche.get(f.vehiculo_id)
        if (!prev || prev.created_at < f.created_at) facturaPorCoche.set(f.vehiculo_id, f)
    }

    const ventas: Venta[] = []
    for (const v of vehicles) {
        if (v.estado !== 'vendido') continue
        const contrato = contratoPorCoche.get(v.id)
        const factura = facturaPorCoche.get(v.id)

        let fecha: Date | null = null
        let origenFecha: OrigenFecha = 'aprox'
        if (contrato) { fecha = parseDate(contrato.fecha_firma); origenFecha = 'contrato' }
        if (!fecha && factura) { fecha = parseDate(factura.created_at); origenFecha = 'factura' }
        if (!fecha) { fecha = parseDate(v.updated_at) || parseDate(v.created_at); origenFecha = 'aprox' }
        if (!fecha) continue

        const precio = contrato?.precio_venta && contrato.precio_venta > 0 ? contrato.precio_venta : precioNeto(v)
        const coste = costeTotal(v)
        ventas.push({ vehicle: v, fecha, origenFecha, precio, coste, margen: coste === null ? null : precio - coste })
    }
    return ventas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
}

// ============================================================================
// KPIs
// ============================================================================

export interface Comparacion {
    actual: number
    anterior: number
    /** Variación en %; null si no hay base para comparar */
    delta: number | null
}

function comparar(actual: number, anterior: number): Comparacion {
    return { actual, anterior, delta: anterior !== 0 ? ((actual - anterior) / Math.abs(anterior)) * 100 : null }
}

export interface MesSerie {
    key: string
    label: string
    unidades: number
    ingresos: number
    margen: number
    aproximadas: number
}

/** Serie de los últimos N meses (incluido el actual), rellenando meses vacíos */
export function serieMensual(ventas: Venta[], now: Date, meses = 12): MesSerie[] {
    const serie: MesSerie[] = []
    const index = new Map<string, MesSerie>()
    for (let i = meses - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
        const item: MesSerie = { key: monthKey(d), label, unidades: 0, ingresos: 0, margen: 0, aproximadas: 0 }
        serie.push(item)
        index.set(item.key, item)
    }
    for (const v of ventas) {
        const item = index.get(monthKey(v.fecha))
        if (!item) continue
        item.unidades++
        item.ingresos += v.precio
        if (v.margen !== null) item.margen += v.margen
        if (v.origenFecha === 'aprox') item.aproximadas++
    }
    return serie
}

export interface Kpis {
    vendidos: Comparacion
    ingresos: Comparacion
    margen: Comparacion
    margenMedio: number | null
    margenPct: number | null
    ventasSinCoste: number
    ventasAproximadas: number
    stockCoste: number
    stockPvp: number
    stockMargenPotencial: number
    stockUnidades: number
    stockSinCoste: number
    diasMedios: number
    parados: number
}

export function calcularKpis(vehicles: Vehicle[], ventas: Venta[], rango: RangoPeriodo, now: Date): Kpis {
    let vendidos = 0, vendidosPrev = 0, ingresos = 0, ingresosPrev = 0
    let margen = 0, margenPrev = 0, ingresosConCoste = 0, conCoste = 0, sinCoste = 0, aproximadas = 0

    for (const v of ventas) {
        if (inRange(v.fecha, rango.desde, rango.hasta)) {
            vendidos++
            ingresos += v.precio
            if (v.origenFecha === 'aprox') aproximadas++
            if (v.margen === null) sinCoste++
            else { margen += v.margen; ingresosConCoste += v.precio; conCoste++ }
        } else if (inRange(v.fecha, rango.prevDesde, rango.prevHasta)) {
            vendidosPrev++
            ingresosPrev += v.precio
            if (v.margen !== null) margenPrev += v.margen
        }
    }

    let stockCoste = 0, stockPvp = 0, stockMargen = 0, stockUnidades = 0, stockSinCoste = 0, diasTotal = 0, parados = 0
    for (const v of vehicles) {
        if (!enStock(v)) continue
        stockUnidades++
        const pvp = precioNeto(v)
        stockPvp += pvp
        const coste = costeTotal(v)
        if (coste === null) stockSinCoste++
        else { stockCoste += coste; stockMargen += pvp - coste }
        const dias = diasEnStock(v, now)
        diasTotal += dias
        if (v.estado === 'disponible' && dias > DIAS_RIESGO) parados++
    }

    return {
        vendidos: comparar(vendidos, vendidosPrev),
        ingresos: comparar(ingresos, ingresosPrev),
        margen: comparar(margen, margenPrev),
        margenMedio: conCoste > 0 ? margen / conCoste : null,
        margenPct: ingresosConCoste > 0 ? (margen / ingresosConCoste) * 100 : null,
        ventasSinCoste: sinCoste,
        ventasAproximadas: aproximadas,
        stockCoste,
        stockPvp,
        stockMargenPotencial: stockMargen,
        stockUnidades,
        stockSinCoste,
        diasMedios: stockUnidades > 0 ? Math.round(diasTotal / stockUnidades) : 0,
        parados,
    }
}

// ============================================================================
// ANTIGÜEDAD DEL STOCK
// ============================================================================

export interface TramoAntiguedad {
    key: string
    label: string
    min: number
    max: number
    unidades: number
    coste: number
    pvp: number
}

export function antiguedadStock(vehicles: Vehicle[], now: Date): TramoAntiguedad[] {
    const tramos = TRAMOS_ANTIGUEDAD.map(t => ({ ...t, unidades: 0, coste: 0, pvp: 0 }))
    for (const v of vehicles) {
        if (!enStock(v)) continue
        const dias = diasEnStock(v, now)
        const tramo = tramos.find(t => dias >= t.min && dias <= t.max) ?? tramos[tramos.length - 1]
        tramo.unidades++
        tramo.coste += costeTotal(v) ?? 0
        tramo.pvp += precioNeto(v)
    }
    return tramos
}

// ============================================================================
// COCHES PARA REBAJAR
// ============================================================================

export interface CandidatoRebaja {
    vehicle: Vehicle
    dias: number
    pvp: number
    coste: number | null
    margen: number | null
    margenPct: number | null
}

/** Disponibles que llevan más de DIAS_REBAJA días, primero los más antiguos */
export function candidatosRebaja(vehicles: Vehicle[], now: Date, diasMin = DIAS_REBAJA): CandidatoRebaja[] {
    return vehicles
        .filter(v => v.estado === 'disponible')
        .map(v => {
            const pvp = precioNeto(v)
            const coste = costeTotal(v)
            const margen = coste === null ? null : pvp - coste
            return {
                vehicle: v,
                dias: diasEnStock(v, now),
                pvp,
                coste,
                margen,
                margenPct: margen !== null && pvp > 0 ? (margen / pvp) * 100 : null,
            }
        })
        .filter(c => c.dias > diasMin)
        // A igualdad de días, primero el que más dinero tiene parado
        .sort((a, b) => b.dias - a.dias || (b.coste ?? b.pvp) - (a.coste ?? a.pvp))
}

// ============================================================================
// MARGEN POR COCHE
// ============================================================================

export function rankingMargen(ventas: Venta[], rango: RangoPeriodo, n = 5): { mejores: Venta[]; peores: Venta[]; total: number } {
    const conMargen = ventas
        .filter(v => v.margen !== null && inRange(v.fecha, rango.desde, rango.hasta))
        .sort((a, b) => (b.margen as number) - (a.margen as number))
    if (conMargen.length <= n * 2) return { mejores: conMargen, peores: [], total: conMargen.length }
    return { mejores: conMargen.slice(0, n), peores: conMargen.slice(-n), total: conMargen.length }
}

// ============================================================================
// MIX: QUÉ TENGO vs QUÉ SE VENDE
// ============================================================================

export type DimensionMix = 'marca' | 'combustible' | 'precio'

export interface FilaMix {
    key: string
    label: string
    stock: number
    ventas: number
    stockPct: number
    ventasPct: number
}

const COMBUSTIBLE_LABEL: Record<string, string> = {
    gasolina: 'Gasolina',
    diesel: 'Diésel',
    hibrido: 'Híbrido',
    hibrido_enchufable: 'Híbrido enchufable',
    electrico: 'Eléctrico',
    glp: 'GLP',
    gnc: 'GNC',
}

/** Clave de marca sin tildes ni mayúsculas para agrupar variantes */
export function normalizarMarca(marca: string): string {
    return marca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
}

function mixKey(v: Vehicle, dim: DimensionMix): { key: string; label: string } {
    if (dim === 'marca') {
        const marca = (v.marca || 'Sin marca').trim()
        // "Citroën" y "Citroen" son la misma marca
        return { key: normalizarMarca(marca), label: marca }
    }
    if (dim === 'combustible') {
        const c = v.combustible || 'otro'
        return { key: c, label: COMBUSTIBLE_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1) }
    }
    const pvp = precioNeto(v)
    const r = RANGOS_PRECIO.find(r => pvp >= r.min && pvp < r.max) ?? RANGOS_PRECIO[0]
    return { key: r.key, label: r.label }
}

/** Reparto del stock actual frente a las ventas del periodo, en % */
export function mix(vehicles: Vehicle[], ventas: Venta[], rango: RangoPeriodo, dim: DimensionMix, top = 7): FilaMix[] {
    const filas = new Map<string, FilaMix>()
    const get = (v: Vehicle) => {
        const { key, label } = mixKey(v, dim)
        let fila = filas.get(key)
        if (!fila) { fila = { key, label, stock: 0, ventas: 0, stockPct: 0, ventasPct: 0 }; filas.set(key, fila) }
        return fila
    }
    let totalStock = 0, totalVentas = 0
    for (const v of vehicles) if (enStock(v)) { get(v).stock++; totalStock++ }
    for (const venta of ventas) if (inRange(venta.fecha, rango.desde, rango.hasta)) { get(venta.vehicle).ventas++; totalVentas++ }

    let lista = Array.from(filas.values())
    if (dim === 'precio') {
        const orden = RANGOS_PRECIO.map(r => r.key as string)
        lista.sort((a, b) => orden.indexOf(a.key) - orden.indexOf(b.key))
    } else {
        lista.sort((a, b) => (b.stock + b.ventas) - (a.stock + a.ventas))
        if (lista.length > top) {
            const resto = lista.slice(top)
            lista = lista.slice(0, top)
            lista.push({
                key: '__otras',
                label: dim === 'marca' ? 'Otras marcas' : 'Otros',
                stock: resto.reduce((s, f) => s + f.stock, 0),
                ventas: resto.reduce((s, f) => s + f.ventas, 0),
                stockPct: 0,
                ventasPct: 0,
            })
        }
    }
    for (const f of lista) {
        f.stockPct = totalStock > 0 ? (f.stock / totalStock) * 100 : 0
        f.ventasPct = totalVentas > 0 ? (f.ventas / totalVentas) * 100 : 0
    }
    return lista
}

// ============================================================================
// VENCIMIENTOS
// ============================================================================

export type TipoVencimiento = 'itv' | 'seguro' | 'reserva' | 'factura' | 'tarea'

export interface Vencimiento {
    id: string
    tipo: TipoVencimiento
    fecha: Date
    dias: number
    titulo: string
    detalle: string
    enlace: string
}

export function vencimientos(
    input: { vehicles: Vehicle[]; senales: SenalLite[]; polizas: PolizaLite[]; facturas: FacturaLite[]; tareas: TareaLite[] },
    now: Date,
    ventana = DIAS_VENCIMIENTOS,
): Vencimiento[] {
    const out: Vencimiento[] = []
    const limite = new Date(startOfDay(now).getTime() + ventana * DAY)
    const stockIds = new Set(input.vehicles.filter(enStock).map(v => v.id))
    const push = (v: Omit<Vencimiento, 'dias'>) => {
        if (v.fecha > limite) return
        out.push({ ...v, dias: daysBetween(now, v.fecha) })
    }
    const coche = (v: Vehicle) => `${v.marca} ${modeloCorto(v.modelo)}${v.matricula ? ` · ${v.matricula}` : ''}`

    for (const v of input.vehicles) {
        if (!enStock(v)) continue
        const fecha = parseDate(v.fecha_itv_vencimiento)
        if (fecha) push({ id: `itv-${v.id}`, tipo: 'itv', fecha, titulo: 'ITV', detalle: coche(v), enlace: `/inventario/${v.id}` })
    }
    for (const p of input.polizas) {
        if (p.estado !== 'activa') continue
        // Las pólizas de coches ya vendidos se gestionan desde Seguros
        if (p.vehiculo_id && !stockIds.has(p.vehiculo_id)) continue
        const fecha = parseDate(p.fecha_vencimiento)
        if (fecha) push({
            id: `poliza-${p.id}`, tipo: 'seguro', fecha, titulo: 'Seguro',
            detalle: [p.vehiculo_matricula, p.compania_aseguradora].filter(Boolean).join(' · ') || (p.numero_poliza ?? 'Póliza'),
            enlace: '/seguro',
        })
    }
    for (const s of input.senales) {
        if (s.estado !== 'activa') continue
        const fecha = parseDate(s.fecha_limite_venta)
        if (fecha) push({
            id: `senal-${s.id}`, tipo: 'reserva', fecha, titulo: 'Reserva caduca',
            detalle: [`${s.vehiculo_marca ?? ''} ${s.vehiculo_modelo ?? ''}`.trim(), s.comprador_nombre].filter(Boolean).join(' · '),
            enlace: '/contratos',
        })
    }
    for (const f of input.facturas) {
        if (f.estado !== 'pendiente' && f.estado !== 'vencida') continue
        const fecha = parseDate(f.fecha_vencimiento)
        if (fecha) push({
            id: `factura-${f.id}`, tipo: 'factura', fecha, titulo: 'Cobro de factura',
            detalle: [f.numero_factura, f.cliente_nombre].filter(Boolean).join(' · '),
            enlace: '/facturacion',
        })
    }
    for (const t of input.tareas) {
        if (t.completada) continue
        const fecha = parseDate(t.fecha_vencimiento)
        if (fecha) push({ id: `tarea-${t.id}`, tipo: 'tarea', fecha, titulo: 'Tarea', detalle: t.titulo, enlace: '/contactos' })
    }
    return out.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
}
