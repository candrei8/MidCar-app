"use client"

import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getContactsStats } from '@/lib/supabase-service'
import { useAuth } from '@/lib/auth-context'
import type {
    ContratoLite, FacturaLite, PolizaLite, RangoPeriodo, SenalLite, TareaLite,
} from '@/lib/dashboard-metrics'
import { DIAS_VENCIMIENTOS } from '@/lib/dashboard-metrics'

export interface DashboardExtras {
    contratos: ContratoLite[]
    facturas: FacturaLite[]
    senales: SenalLite[]
    polizas: PolizaLite[]
    tareas: TareaLite[]
    contactos: Awaited<ReturnType<typeof getContactsStats>>
}

export interface ContactosPeriodo {
    nuevos: number
    nuevosPrev: number
    reservas: number
}

const PAGE = 1000

/** Descarga todas las filas paginando (PostgREST corta en 1000 por petición) */
async function fetchAll<T>(table: string, columns: string, build?: (q: any) => any): Promise<T[]> {
    const rows: T[] = []
    for (let from = 0; ; from += PAGE) {
        let q = supabase.from(table).select(columns).order('id', { ascending: true }).range(from, from + PAGE - 1)
        if (build) q = build(q)
        const { data, error } = await q
        if (error) throw new Error(`No se pudo cargar ${table}`)
        rows.push(...((data || []) as T[]))
        if (!data || data.length < PAGE) break
    }
    return rows
}

function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadExtras(): Promise<DashboardExtras> {
    const limite = new Date()
    limite.setDate(limite.getDate() + DIAS_VENCIMIENTOS)
    const hasta = isoDate(limite)

    const [contratos, facturas, senales, polizas, tareas, contactos] = await Promise.all([
        fetchAll<ContratoLite>('contratos', 'id, vehiculo_id, estado, fecha_firma, precio_venta'),
        fetchAll<FacturaLite>('facturas', 'id, numero_factura, vehiculo_id, cliente_nombre, estado, total, fecha_vencimiento, created_at'),
        fetchAll<SenalLite>('senales', 'id, vehiculo_id, vehiculo_marca, vehiculo_modelo, comprador_nombre, estado, fecha_senal, fecha_limite_venta'),
        fetchAll<PolizaLite>('polizas_seguro', 'id, vehiculo_id, vehiculo_matricula, numero_poliza, compania_aseguradora, estado, fecha_vencimiento',
            q => q.eq('estado', 'activa').lte('fecha_vencimiento', hasta)),
        fetchAll<TareaLite>('tasks', 'id, titulo, fecha_vencimiento, completada',
            q => q.eq('completada', false).lte('fecha_vencimiento', hasta)),
        getContactsStats(),
    ])
    return { contratos, facturas, senales, polizas, tareas, contactos }
}

async function loadContactosPeriodo(rango: RangoPeriodo): Promise<ContactosPeriodo> {
    const count = async (desde: Date, hasta: Date) => {
        const { count, error } = await supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .gte('fecha_registro', desde.toISOString())
            .lt('fecha_registro', hasta.toISOString())
        if (error) throw new Error('No se pudieron contar los contactos')
        return count ?? 0
    }
    const reservas = async () => {
        const { count, error } = await supabase
            .from('senales')
            .select('id', { count: 'exact', head: true })
            .gte('fecha_senal', isoDate(rango.desde))
            .lt('fecha_senal', isoDate(rango.hasta))
            .neq('estado', 'cancelada')
        if (error) throw new Error('No se pudieron contar las reservas')
        return count ?? 0
    }
    const [nuevos, nuevosPrev, nReservas] = await Promise.all([
        count(rango.desde, rango.hasta),
        count(rango.prevDesde, rango.prevHasta),
        reservas(),
    ])
    return { nuevos, nuevosPrev, reservas: nReservas }
}

/** Documentos y conteos que el dashboard necesita además de los vehículos */
export function useDashboardData(rango: RangoPeriodo) {
    const { loading: authLoading, user } = useAuth()
    const [extras, setExtras] = useState<DashboardExtras | null>(null)
    const [contactosPeriodo, setContactosPeriodo] = useState<ContactosPeriodo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    const reload = useCallback(() => setReloadKey(k => k + 1), [])

    useEffect(() => {
        const handler = () => reload()
        window.addEventListener('midcar-data-updated', handler)
        return () => window.removeEventListener('midcar-data-updated', handler)
    }, [reload])

    useEffect(() => {
        if (authLoading || !user || !isSupabaseConfigured) return
        let cancelled = false
        loadExtras()
            .then(data => { if (!cancelled) { setExtras(data); setError(null) } })
            .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar el panel') })
        return () => { cancelled = true }
    }, [authLoading, user, reloadKey])

    const desdeMs = rango.desde.getTime()
    const hastaMs = rango.hasta.getTime()
    useEffect(() => {
        if (authLoading || !user || !isSupabaseConfigured) return
        let cancelled = false
        setContactosPeriodo(null)
        loadContactosPeriodo(rango)
            .then(data => { if (!cancelled) setContactosPeriodo(data) })
            .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar el panel') })
        return () => { cancelled = true }
        // rango se identifica por sus fechas; el objeto cambia en cada render
    }, [authLoading, user, desdeMs, hastaMs, reloadKey])

    return { extras, contactosPeriodo, error, reload }
}
