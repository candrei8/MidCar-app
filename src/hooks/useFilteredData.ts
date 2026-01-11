"use client"

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { mockContacts, mockLeads, mockClients, mockVehicles } from '@/lib/mock-data'
import { getUserContacts, getUserLeads, getUserVehicles, getVehicleOverrides } from '@/lib/data-store'
import type { Contact, Lead, Client, Vehicle } from '@/types'

export function useFilteredData() {
    const { user, profile, isFullView } = useAuth()
    const [refreshKey, setRefreshKey] = useState(0)

    // ID del usuario actual para filtrar datos creados por él
    const currentUserId = user?.id || null

    // Escuchar cambios en los datos del usuario
    useEffect(() => {
        const handleDataUpdate = () => {
            setRefreshKey(prev => prev + 1)
        }
        window.addEventListener('midcar-data-updated', handleDataUpdate)
        return () => window.removeEventListener('midcar-data-updated', handleDataUpdate)
    }, [])

    // Función para refrescar datos manualmente
    const refreshData = useCallback(() => {
        setRefreshKey(prev => prev + 1)
    }, [])

    // Obtener datos creados por usuarios desde localStorage
    const userCreatedContacts = useMemo(() => getUserContacts(), [refreshKey])
    const userCreatedLeads = useMemo(() => getUserLeads(), [refreshKey])
    const userCreatedVehicles = useMemo(() => getUserVehicles(), [refreshKey])
    const vehicleOverrides = useMemo(() => getVehicleOverrides(), [refreshKey])

    // CONTACTS
    // - Mi Vista: Solo contactos creados por el usuario actual
    // - Visión Completa: Mock data + todos los contactos creados por usuarios
    const contacts = useMemo((): Contact[] => {
        if (isFullView) {
            // Combinar mock data con datos de usuarios
            return [...mockContacts, ...userCreatedContacts]
        }
        // Mi Vista: Solo datos del usuario actual
        return userCreatedContacts.filter(c => c.created_by === currentUserId)
    }, [isFullView, currentUserId, userCreatedContacts])

    // LEADS
    // - Mi Vista: Solo leads creados/asignados al usuario actual
    // - Visión Completa: Mock data + todos los leads creados por usuarios
    const leads = useMemo((): Lead[] => {
        if (isFullView) {
            return [...mockLeads, ...userCreatedLeads]
        }
        // Mi Vista: Solo leads del usuario actual
        return userCreatedLeads.filter(l => l.asignado_a === currentUserId || l.created_by === currentUserId)
    }, [isFullView, currentUserId, userCreatedLeads])

    // CLIENTS
    // - Mi Vista: Clientes relacionados con los leads del usuario
    // - Visión Completa: Todos los clientes
    const clients = useMemo((): Client[] => {
        if (isFullView) {
            return mockClients
        }
        // En Mi Vista, devolver clientes relacionados con los leads del usuario
        const clientIds = new Set(leads.map(l => l.cliente_id))
        return mockClients.filter(c => clientIds.has(c.id))
    }, [isFullView, leads])

    // VEHICLES
    // - Mi Vista: Solo vehículos creados por el usuario actual
    // - Visión Completa: Mock data (con overrides aplicados) + todos los vehículos creados por usuarios
    const vehicles = useMemo((): Vehicle[] => {
        // Aplicar overrides a los mock vehicles
        const mockWithOverrides = mockVehicles.map(v => {
            const override = vehicleOverrides[v.id]
            return override ? { ...v, ...override } : v
        })

        if (isFullView) {
            return [...mockWithOverrides, ...userCreatedVehicles]
        }
        // Mi Vista: Solo vehículos del usuario actual
        return userCreatedVehicles.filter(v => v.created_by === currentUserId)
    }, [isFullView, currentUserId, userCreatedVehicles, vehicleOverrides])

    // Stats calculados desde los datos filtrados
    const stats = useMemo(() => {
        return {
            // Contact stats
            totalContacts: contacts.length,
            contactsPendientes: contacts.filter(c => c.estado === 'pendiente').length,
            contactsComunicados: contacts.filter(c => c.estado === 'comunicado').length,
            contactsTramite: contacts.filter(c => c.estado === 'tramite').length,
            contactsReservados: contacts.filter(c => c.estado === 'reservado').length,
            contactsPostventa: contacts.filter(c => c.estado === 'postventa').length,
            contactsCerrados: contacts.filter(c => c.estado === 'cerrado').length,

            // Lead stats
            totalLeads: leads.length,
            leadsNuevos: leads.filter(l => l.estado === 'nuevo').length,
            leadsContactados: leads.filter(l => l.estado === 'contactado').length,
            leadsVisita: leads.filter(l => l.estado === 'visita_agendada').length,
            leadsPropuesta: leads.filter(l => l.estado === 'propuesta_enviada').length,
            leadsNegociacion: leads.filter(l => l.estado === 'negociacion').length,
            leadsVendidos: leads.filter(l => l.estado === 'vendido').length,
            leadsPerdidos: leads.filter(l => l.estado === 'perdido').length,

            // Vehicle stats
            totalVehicles: vehicles.length,
            vehiclesDisponible: vehicles.filter(v => v.estado === 'disponible').length,
            vehiclesReservado: vehicles.filter(v => v.estado === 'reservado').length,
            vehiclesVendido: vehicles.filter(v => v.estado === 'vendido').length,

            // Value stats
            valorPipeline: leads
                .filter(l => !['vendido', 'perdido'].includes(l.estado))
                .reduce((sum, l) => sum + ((l.presupuesto_cliente || 0) * (l.probabilidad || 0) / 100), 0),

            // Conversion rate
            tasaConversion: leads.length > 0
                ? (leads.filter(l => l.estado === 'vendido').length / leads.length) * 100
                : 0,
        }
    }, [contacts, leads, vehicles])

    return {
        contacts,
        leads,
        clients,
        vehicles,
        stats,
        isFullView,
        currentUserId,
        userName: profile ? `${profile.nombre} ${profile.apellidos}` : 'Usuario',
        refreshData,
    }
}
