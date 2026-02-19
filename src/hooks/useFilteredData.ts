"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getVehicles, getLeadsStats, getContactsStats } from '@/lib/supabase-service'
import type { Client, Vehicle } from '@/types'

// Cache global para evitar refetches entre componentes
const dataCache = {
    vehicles: [] as Vehicle[],
    leadsStats: null as Awaited<ReturnType<typeof getLeadsStats>> | null,
    contactsStats: null as Awaited<ReturnType<typeof getContactsStats>> | null,
    lastFetch: 0,
    isFetching: false,
}

// Tiempo mínimo entre fetches automáticos (2 segundos)
const CACHE_DURATION = 2000

// Función para invalidar el cache completamente
export function invalidateDataCache() {
    dataCache.lastFetch = 0
    dataCache.isFetching = false
}

export function useFilteredData() {
    const { user, profile, isFullView } = useAuth()
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(dataCache.lastFetch === 0)
    const mountedRef = useRef(true)

    // Data state - inicializa con cache si existe
    const [allVehicles, setAllVehicles] = useState<Vehicle[]>(dataCache.vehicles)
    const [leadsStats, setLeadsStats] = useState(dataCache.leadsStats)
    const [contactsStats, setContactsStats] = useState(dataCache.contactsStats)

    // ID del usuario actual para filtrar datos creados por él
    const currentUserId = user?.id || null

    // Cargar datos de Supabase con cache
    const loadData = useCallback(async (force = false) => {
        const now = Date.now()

        // Si hay datos en cache recientes y no es forzado, usar cache
        if (!force && dataCache.lastFetch > 0 && (now - dataCache.lastFetch) < CACHE_DURATION) {
            if (mountedRef.current) {
                setAllVehicles(dataCache.vehicles)
                setLeadsStats(dataCache.leadsStats)
                setContactsStats(dataCache.contactsStats)
                setIsLoading(false)
            }
            return
        }

        if (dataCache.isFetching && !force) return

        dataCache.isFetching = true
        if (mountedRef.current) setIsLoading(true)

        try {
            const [vehiclesData, leadsStatsData, contactsStatsData] = await Promise.all([
                getVehicles(),
                getLeadsStats(),
                getContactsStats(),
            ])

            // Actualizar cache global
            dataCache.vehicles = vehiclesData
            dataCache.leadsStats = leadsStatsData
            dataCache.contactsStats = contactsStatsData
            dataCache.lastFetch = Date.now()

            if (mountedRef.current) {
                setAllVehicles(vehiclesData)
                setLeadsStats(leadsStatsData)
                setContactsStats(contactsStatsData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            dataCache.isFetching = false
            if (mountedRef.current) setIsLoading(false)
        }
    }, [])

    // Cleanup ref on unmount
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Cargar datos iniciales
    useEffect(() => {
        loadData()
    }, [loadData])

    // Recargar cuando cambie refreshKey (forzar)
    useEffect(() => {
        if (refreshKey > 0) {
            invalidateDataCache()
            loadData(true)
        }
    }, [refreshKey, loadData])

    // Escuchar cambios en los datos del usuario
    useEffect(() => {
        const handleDataUpdate = () => {
            invalidateDataCache()
            setRefreshKey(prev => prev + 1)
        }
        window.addEventListener('midcar-data-updated', handleDataUpdate)
        return () => window.removeEventListener('midcar-data-updated', handleDataUpdate)
    }, [])

    // Función para refrescar datos manualmente
    const refreshData = useCallback(() => {
        invalidateDataCache()
        setRefreshKey(prev => prev + 1)
    }, [])

    // VEHICLES - Filtrado por usuario o vista completa
    const vehicles = useMemo((): Vehicle[] => {
        if (isFullView) return allVehicles
        if (!currentUserId) return []
        return allVehicles.filter(v => v.created_by === currentUserId)
    }, [isFullView, currentUserId, allVehicles])

    // CLIENTS - derived from vehicles (for header search - small set)
    const contacts: never[] = [] // contacts no longer bulk-loaded; use getContactsPage()
    const leads: never[] = []    // leads no longer bulk-loaded; use getLeadsPage()
    const clients: Client[] = [] // clients derived from leads - no longer needed

    // Stats calculados - INCLUYE MÉTRICAS FINANCIERAS REALES (vehicles) + stats fast counts
    const stats = useMemo(() => {
        const ls = leadsStats
        const cs = contactsStats

        // Vehicle stats - CONTEOS
        const vehicleStats = { disponible: 0, reservado: 0, vendido: 0, taller: 0, baja: 0 }

        // MÉTRICAS FINANCIERAS REALES
        let valorStock = 0
        let inversionStock = 0
        let margenPotencial = 0
        let ventasIngreso = 0
        let ventasCoste = 0
        let margenRealizado = 0

        // ALERTAS DE ITV Y STOCK
        const vehiculosITVProxima: typeof vehicles = []
        const vehiculosITVVencida: typeof vehicles = []
        const vehiculosMuchosDiasStock: typeof vehicles = []
        const today = new Date()
        const treintaDias = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

        for (const v of vehicles) {
            if (v.estado in vehicleStats) vehicleStats[v.estado as keyof typeof vehicleStats]++

            if (v.estado === 'disponible' || v.estado === 'reservado') {
                valorStock += v.precio_venta || 0
                const costeTotal = (v.precio_compra || 0) + (v.gastos_compra || 0) + (v.coste_reparaciones || 0)
                inversionStock += costeTotal
            }

            if (v.estado === 'vendido') {
                ventasIngreso += v.precio_venta || 0
                ventasCoste += (v.precio_compra || 0) + (v.gastos_compra || 0) + (v.coste_reparaciones || 0)
            }

            if ((v.estado === 'disponible' || v.estado === 'reservado') && v.fecha_itv_vencimiento) {
                const fechaITV = new Date(v.fecha_itv_vencimiento)
                if (fechaITV < today) vehiculosITVVencida.push(v)
                else if (fechaITV <= treintaDias) vehiculosITVProxima.push(v)
            }

            if (v.estado === 'disponible' && v.dias_en_stock > 90) vehiculosMuchosDiasStock.push(v)
        }

        margenPotencial = valorStock - inversionStock
        margenRealizado = ventasIngreso - ventasCoste
        const margenPorcentaje = valorStock > 0 ? (margenPotencial / valorStock) * 100 : 0
        const margenVentasPorcentaje = ventasIngreso > 0 ? (margenRealizado / ventasIngreso) * 100 : 0

        const vehiculosEnStock = vehicles.filter(v => v.estado === 'disponible' || v.estado === 'reservado')
        const diasPromedioStock = vehiculosEnStock.length > 0
            ? vehiculosEnStock.reduce((sum, v) => sum + (v.dias_en_stock || 0), 0) / vehiculosEnStock.length
            : 0

        return {
            // Contact stats — from fast count query
            totalContacts: cs?.total ?? 0,
            contactsPendientes: cs?.pendiente ?? 0,
            contactsComunicados: cs?.comunicado ?? 0,
            contactsTramite: cs?.tramite ?? 0,
            contactsReservados: cs?.reservado ?? 0,
            contactsPostventa: cs?.postventa ?? 0,
            contactsBusqueda: cs?.busqueda ?? 0,
            contactsCerrados: cs?.cerrado ?? 0,
            // Lead stats — from fast count query
            totalLeads: ls?.total ?? 0,
            leadsNuevos: ls?.nuevo ?? 0,
            leadsContactados: ls?.contactado ?? 0,
            leadsVisita: ls?.visita_agendada ?? 0,
            leadsPrueba: ls?.prueba_programada ?? 0,
            leadsPropuesta: ls?.propuesta_enviada ?? 0,
            leadsNegociacion: ls?.negociacion ?? 0,
            leadsVendidos: ls?.vendido ?? 0,
            leadsPerdidos: ls?.perdido ?? 0,
            // Vehicle counts
            totalVehicles: vehicles.length,
            vehiclesDisponible: vehicleStats.disponible,
            vehiclesReservado: vehicleStats.reservado,
            vehiclesVendido: vehicleStats.vendido,
            vehiclesTaller: vehicleStats.taller,
            vehiclesBaja: vehicleStats.baja,
            // MÉTRICAS FINANCIERAS
            valorStock,
            inversionStock,
            margenPotencial,
            margenPorcentaje,
            ventasIngreso,
            ventasCoste,
            margenRealizado,
            margenVentasPorcentaje,
            // Performance
            diasPromedioStock: Math.round(diasPromedioStock),
            // Alertas
            vehiculosITVVencida,
            vehiculosITVProxima,
            vehiculosMuchosDiasStock,
            alertasCount: vehiculosITVVencida.length + vehiculosITVProxima.length + vehiculosMuchosDiasStock.length,
            // Pipeline / CRM
            valorPipeline: ls?.valorPipeline ?? 0,
            tasaConversion: ls?.tasaConversion ?? 0,
        }
    }, [contacts, leads, vehicles, leadsStats, contactsStats])

    return {
        contacts,
        leads,
        clients,
        vehicles,
        stats,
        isFullView,
        isLoading,
        currentUserId,
        userName: profile ? `${profile.nombre} ${profile.apellidos}` : 'Usuario',
        refreshData,
    }
}
