"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getVehicles } from '@/lib/supabase-service'
import type { Client, Vehicle } from '@/types'

// Stable empty arrays — declared at module level to avoid new refs every render
const EMPTY_CONTACTS: never[] = []
const EMPTY_LEADS: never[] = []
const EMPTY_CLIENTS: Client[] = []

// Cache global para evitar refetches entre componentes
const dataCache = {
    vehicles: [] as Vehicle[],
    lastFetch: 0,
    // Petición en curso compartida: si el Header y la página montan a la vez,
    // la segunda reutiliza la misma promesa en vez de lanzar otra descarga
    inflight: null as Promise<Vehicle[]> | null,
}

// Tiempo mínimo entre fetches automáticos (2 segundos)
const CACHE_DURATION = 2000

// Función para invalidar el cache completamente
export function invalidateDataCache() {
    dataCache.lastFetch = 0
}

function fetchVehiclesShared(): Promise<Vehicle[]> {
    if (!dataCache.inflight) {
        dataCache.inflight = getVehicles()
            .then(vehicles => {
                dataCache.vehicles = vehicles
                dataCache.lastFetch = Date.now()
                return vehicles
            })
            .finally(() => { dataCache.inflight = null })
    }
    return dataCache.inflight
}

export function useFilteredData() {
    const { user, profile, loading: authLoading } = useAuth()
    const [refreshKey, setRefreshKey] = useState(0)
    const [isLoading, setIsLoading] = useState(dataCache.lastFetch === 0)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    // Data state - inicializa con cache si existe
    const [vehicles, setVehicles] = useState<Vehicle[]>(dataCache.vehicles)

    // ID del usuario actual para filtrar datos creados por él
    const currentUserId = user?.id || null

    const loadData = useCallback(async (force = false) => {
        const fresh = dataCache.lastFetch > 0 && (Date.now() - dataCache.lastFetch) < CACHE_DURATION
        if (!force && fresh) {
            if (mountedRef.current) {
                setVehicles(dataCache.vehicles)
                setIsLoading(false)
            }
            return
        }

        if (mountedRef.current && dataCache.lastFetch === 0) setIsLoading(true)

        try {
            const vehiclesData = await fetchVehiclesShared()
            if (mountedRef.current) {
                setVehicles(vehiclesData)
                setError(null)
            }
        } catch (err) {
            console.error('Error loading data:', err)
            if (mountedRef.current) setError(err instanceof Error ? err.message : 'Error al cargar los datos')
        } finally {
            if (mountedRef.current) setIsLoading(false)
        }
    }, [])

    // Cleanup ref on unmount
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Esperar a que auth esté listo antes de cargar datos
    // Re-cargar cuando cambie el usuario (login/logout/token refresh)
    useEffect(() => {
        if (authLoading) return
        loadData(true)
    }, [authLoading, currentUserId, loadData])

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

    const contacts = EMPTY_CONTACTS // contacts no longer bulk-loaded; use getContactsPage()
    const leads = EMPTY_LEADS        // leads no longer bulk-loaded; use getLeadsPage()
    const clients = EMPTY_CLIENTS    // clients derived from leads - no longer needed

    return {
        contacts,
        leads,
        clients,
        vehicles,
        isLoading,
        error,
        currentUserId,
        userName: profile ? `${profile.nombre} ${profile.apellidos}` : 'Usuario',
        refreshData,
    }
}
