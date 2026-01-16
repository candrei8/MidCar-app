"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getVehicles, getContacts, getLeads } from '@/lib/supabase-service'
import type { Contact, Lead, Client, Vehicle } from '@/types'

// Cache global para evitar refetches entre componentes
const dataCache = {
    vehicles: [] as Vehicle[],
    contacts: [] as Contact[],
    leads: [] as Lead[],
    lastFetch: 0,
    isFetching: false,
}

// Tiempo mínimo entre fetches automáticos (2 segundos)
// Se puede forzar manualmente ignorando este tiempo
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
    const [allContacts, setAllContacts] = useState<Contact[]>(dataCache.contacts)
    const [allLeads, setAllLeads] = useState<Lead[]>(dataCache.leads)

    // ID del usuario actual para filtrar datos creados por él
    const currentUserId = user?.id || null

    // Cargar datos de Supabase con cache
    const loadData = useCallback(async (force = false) => {
        const now = Date.now()

        // Si hay datos en cache recientes y no es forzado, usar cache
        if (!force && dataCache.lastFetch > 0 && (now - dataCache.lastFetch) < CACHE_DURATION) {
            if (mountedRef.current) {
                setAllVehicles(dataCache.vehicles)
                setAllContacts(dataCache.contacts)
                setAllLeads(dataCache.leads)
                setIsLoading(false)
            }
            return
        }

        // Si ya hay un fetch en progreso y no es forzado, esperar
        // Si es forzado, permitir que continúe para garantizar datos frescos
        if (dataCache.isFetching && !force) return

        dataCache.isFetching = true
        if (mountedRef.current) setIsLoading(true)

        try {
            const [vehiclesData, contactsData, leadsData] = await Promise.all([
                getVehicles(),
                getContacts(),
                getLeads(),
            ])

            // Actualizar cache global
            dataCache.vehicles = vehiclesData
            dataCache.contacts = contactsData
            dataCache.leads = leadsData
            dataCache.lastFetch = Date.now()

            if (mountedRef.current) {
                setAllVehicles(vehiclesData)
                setAllContacts(contactsData)
                setAllLeads(leadsData)
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
            // Invalidar cache antes de forzar recarga
            invalidateDataCache()
            loadData(true)
        }
    }, [refreshKey, loadData])

    // Escuchar cambios en los datos del usuario - SIN debounce para respuesta inmediata
    useEffect(() => {
        const handleDataUpdate = (event: Event) => {
            // Invalidar cache inmediatamente cuando hay cambios
            invalidateDataCache()
            // Forzar recarga inmediata
            setRefreshKey(prev => prev + 1)
        }

        window.addEventListener('midcar-data-updated', handleDataUpdate)
        return () => {
            window.removeEventListener('midcar-data-updated', handleDataUpdate)
        }
    }, [])

    // Función para refrescar datos manualmente
    const refreshData = useCallback(() => {
        invalidateDataCache()
        setRefreshKey(prev => prev + 1)
    }, [])

    // CONTACTS - Filtrado por usuario o vista completa
    const contacts = useMemo((): Contact[] => {
        if (isFullView) {
            // Visión Completa: Todos los contactos
            return allContacts
        }
        // Mi Vista: Solo datos del usuario actual
        if (!currentUserId) return []
        return allContacts.filter(c => c.created_by === currentUserId)
    }, [isFullView, currentUserId, allContacts])

    // LEADS - Filtrado por usuario o vista completa
    const leads = useMemo((): Lead[] => {
        if (isFullView) {
            // Visión Completa: Todos los leads
            return allLeads
        }
        // Mi Vista: Solo leads del usuario actual
        if (!currentUserId) return []
        return allLeads.filter(l => l.asignado_a === currentUserId || l.created_by === currentUserId)
    }, [isFullView, currentUserId, allLeads])

    // CLIENTS - Extraer clientes de los leads creados
    const clients = useMemo((): Client[] => {
        const clientMap = new Map<string, Client>()
        for (const lead of leads) {
            if (lead.cliente && !clientMap.has(lead.cliente.id)) {
                clientMap.set(lead.cliente.id, lead.cliente as Client)
            }
        }
        return Array.from(clientMap.values())
    }, [leads])

    // VEHICLES - Filtrado por usuario o vista completa
    const vehicles = useMemo((): Vehicle[] => {
        if (isFullView) {
            // Visión Completa: Todos los vehículos
            return allVehicles
        }
        // Mi Vista: Solo vehículos del usuario actual
        if (!currentUserId) return []
        return allVehicles.filter(v => v.created_by === currentUserId)
    }, [isFullView, currentUserId, allVehicles])

    // Stats calculados - INCLUYE MÉTRICAS FINANCIERAS REALES
    const stats = useMemo(() => {
        // Contact stats
        const contactStats = { pendiente: 0, comunicado: 0, tramite: 0, reservado: 0, postventa: 0, busqueda: 0, cerrado: 0 }
        for (const c of contacts) {
            if (c.estado in contactStats) contactStats[c.estado as keyof typeof contactStats]++
        }

        // Lead stats
        const leadStats = { nuevo: 0, contactado: 0, visita_agendada: 0, prueba_programada: 0, propuesta_enviada: 0, negociacion: 0, vendido: 0, perdido: 0 }
        let valorPipeline = 0
        for (const l of leads) {
            if (l.estado in leadStats) leadStats[l.estado as keyof typeof leadStats]++
            if (l.estado !== 'vendido' && l.estado !== 'perdido') {
                valorPipeline += ((l.presupuesto_cliente || 0) * (l.probabilidad || 0) / 100)
            }
        }

        // Vehicle stats - CONTEOS
        const vehicleStats = { disponible: 0, reservado: 0, vendido: 0, taller: 0, baja: 0 }

        // MÉTRICAS FINANCIERAS REALES
        let valorStock = 0         // Suma de precios de venta de vehículos disponibles
        let inversionStock = 0     // Suma de coste total de vehículos disponibles
        let margenPotencial = 0    // Diferencia entre valor y coste
        let ventasIngreso = 0      // Ingresos de vehículos vendidos
        let ventasCoste = 0        // Coste de vehículos vendidos
        let margenRealizado = 0    // Margen de ventas realizadas

        // ALERTAS DE ITV Y STOCK
        const vehiculosITVProxima: typeof vehicles = []
        const vehiculosITVVencida: typeof vehicles = []
        const vehiculosMuchosDiasStock: typeof vehicles = []
        const today = new Date()
        const treintaDias = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

        for (const v of vehicles) {
            // Conteo por estado
            if (v.estado in vehicleStats) vehicleStats[v.estado as keyof typeof vehicleStats]++

            // Métricas financieras para vehículos en stock activo
            if (v.estado === 'disponible' || v.estado === 'reservado') {
                valorStock += v.precio_venta || 0
                const costeTotal = (v.precio_compra || 0) + (v.gastos_compra || 0) + (v.coste_reparaciones || 0)
                inversionStock += costeTotal
            }

            // Métricas de ventas (vehículos vendidos)
            if (v.estado === 'vendido') {
                ventasIngreso += v.precio_venta || 0
                ventasCoste += (v.precio_compra || 0) + (v.gastos_compra || 0) + (v.coste_reparaciones || 0)
            }

            // Alertas de ITV - solo para vehículos en stock activo
            if ((v.estado === 'disponible' || v.estado === 'reservado') && v.fecha_itv_vencimiento) {
                const fechaITV = new Date(v.fecha_itv_vencimiento)
                if (fechaITV < today) {
                    vehiculosITVVencida.push(v)
                } else if (fechaITV <= treintaDias) {
                    vehiculosITVProxima.push(v)
                }
            }

            // Vehículos mucho tiempo en stock (>90 días)
            if ((v.estado === 'disponible') && v.dias_en_stock > 90) {
                vehiculosMuchosDiasStock.push(v)
            }
        }

        // Cálculos derivados
        margenPotencial = valorStock - inversionStock
        margenRealizado = ventasIngreso - ventasCoste
        const margenPorcentaje = valorStock > 0 ? (margenPotencial / valorStock) * 100 : 0
        const margenVentasPorcentaje = ventasIngreso > 0 ? (margenRealizado / ventasIngreso) * 100 : 0

        // Días promedio en stock
        const vehiculosEnStock = vehicles.filter(v => v.estado === 'disponible' || v.estado === 'reservado')
        const diasPromedioStock = vehiculosEnStock.length > 0
            ? vehiculosEnStock.reduce((sum, v) => sum + (v.dias_en_stock || 0), 0) / vehiculosEnStock.length
            : 0

        return {
            // Contact stats
            totalContacts: contacts.length,
            contactsPendientes: contactStats.pendiente,
            contactsComunicados: contactStats.comunicado,
            contactsTramite: contactStats.tramite,
            contactsReservados: contactStats.reservado,
            contactsPostventa: contactStats.postventa,
            contactsBusqueda: contactStats.busqueda,
            contactsCerrados: contactStats.cerrado,
            // Lead stats
            totalLeads: leads.length,
            leadsNuevos: leadStats.nuevo,
            leadsContactados: leadStats.contactado,
            leadsVisita: leadStats.visita_agendada,
            leadsPrueba: leadStats.prueba_programada,
            leadsPropuesta: leadStats.propuesta_enviada,
            leadsNegociacion: leadStats.negociacion,
            leadsVendidos: leadStats.vendido,
            leadsPerdidos: leadStats.perdido,
            // Vehicle counts
            totalVehicles: vehicles.length,
            vehiclesDisponible: vehicleStats.disponible,
            vehiclesReservado: vehicleStats.reservado,
            vehiclesVendido: vehicleStats.vendido,
            vehiclesTaller: vehicleStats.taller,
            vehiclesBaja: vehicleStats.baja,
            // NUEVAS MÉTRICAS FINANCIERAS
            valorStock,
            inversionStock,
            margenPotencial,
            margenPorcentaje,
            // Métricas de ventas
            ventasIngreso,
            ventasCoste,
            margenRealizado,
            margenVentasPorcentaje,
            // Performance
            diasPromedioStock: Math.round(diasPromedioStock),
            // Alertas de ITV y stock
            vehiculosITVVencida,
            vehiculosITVProxima,
            vehiculosMuchosDiasStock,
            alertasCount: vehiculosITVVencida.length + vehiculosITVProxima.length + vehiculosMuchosDiasStock.length,
            // Legacy
            valorPipeline,
            tasaConversion: leads.length > 0 ? (leadStats.vendido / leads.length) * 100 : 0,
        }
    }, [contacts, leads, vehicles])

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
