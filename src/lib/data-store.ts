"use client"

/**
 * Data Store
 *
 * Gestiona los datos creados por usuarios.
 * - Persiste en localStorage para mantener datos entre sesiones
 * - En producción, esto se reemplazará por llamadas a Supabase
 */

import type { Contact, Lead, Vehicle } from '@/types'

const STORAGE_KEYS = {
    contacts: 'midcar_user_contacts',
    leads: 'midcar_user_leads',
    vehicles: 'midcar_user_vehicles',
    vehicleOverrides: 'midcar_vehicle_overrides', // Para cambios en vehículos mock
}

// ============================================================================
// CONTACTS
// ============================================================================

export function getUserContacts(): Contact[] {
    if (typeof window === 'undefined') return []
    try {
        const data = localStorage.getItem(STORAGE_KEYS.contacts)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addUserContact(contact: Contact): void {
    if (typeof window === 'undefined') return
    const contacts = getUserContacts()
    contacts.push(contact)
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts))
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
}

export function updateUserContact(contactId: string, updates: Partial<Contact>): void {
    if (typeof window === 'undefined') return
    const contacts = getUserContacts()
    const index = contacts.findIndex(c => c.id === contactId)
    if (index !== -1) {
        contacts[index] = { ...contacts[index], ...updates }
        localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts))
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
    }
}

export function deleteUserContact(contactId: string): void {
    if (typeof window === 'undefined') return
    const contacts = getUserContacts().filter(c => c.id !== contactId)
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
}

// ============================================================================
// LEADS
// ============================================================================

export function getUserLeads(): Lead[] {
    if (typeof window === 'undefined') return []
    try {
        const data = localStorage.getItem(STORAGE_KEYS.leads)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addUserLead(lead: Lead): void {
    if (typeof window === 'undefined') return
    const leads = getUserLeads()
    leads.push(lead)
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'leads' } }))
}

export function updateUserLead(leadId: string, updates: Partial<Lead>): void {
    if (typeof window === 'undefined') return
    const leads = getUserLeads()
    const index = leads.findIndex(l => l.id === leadId)
    if (index !== -1) {
        leads[index] = { ...leads[index], ...updates }
        localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads))
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'leads' } }))
    }
}

export function deleteUserLead(leadId: string): void {
    if (typeof window === 'undefined') return
    const leads = getUserLeads().filter(l => l.id !== leadId)
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'leads' } }))
}

// ============================================================================
// VEHICLES
// ============================================================================

export function getUserVehicles(): Vehicle[] {
    if (typeof window === 'undefined') return []
    try {
        const data = localStorage.getItem(STORAGE_KEYS.vehicles)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

export function addUserVehicle(vehicle: Vehicle): void {
    if (typeof window === 'undefined') return
    const vehicles = getUserVehicles()
    vehicles.push(vehicle)
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
}

export function updateUserVehicle(vehicleId: string, updates: Partial<Vehicle>): void {
    if (typeof window === 'undefined') return
    const vehicles = getUserVehicles()
    const index = vehicles.findIndex(v => v.id === vehicleId)
    if (index !== -1) {
        vehicles[index] = { ...vehicles[index], ...updates }
        localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles))
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
    }
}

export function deleteUserVehicle(vehicleId: string): void {
    if (typeof window === 'undefined') return
    const vehicles = getUserVehicles().filter(v => v.id !== vehicleId)
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
}

// ============================================================================
// VEHICLE OVERRIDES (para editar vehículos mock)
// ============================================================================

export function getVehicleOverrides(): Record<string, Partial<Vehicle>> {
    if (typeof window === 'undefined') return {}
    try {
        const data = localStorage.getItem(STORAGE_KEYS.vehicleOverrides)
        return data ? JSON.parse(data) : {}
    } catch {
        return {}
    }
}

export function setVehicleOverride(vehicleId: string, updates: Partial<Vehicle>): void {
    if (typeof window === 'undefined') return
    const overrides = getVehicleOverrides()
    overrides[vehicleId] = { ...overrides[vehicleId], ...updates }
    localStorage.setItem(STORAGE_KEYS.vehicleOverrides, JSON.stringify(overrides))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
}

export function clearVehicleOverride(vehicleId: string): void {
    if (typeof window === 'undefined') return
    const overrides = getVehicleOverrides()
    delete overrides[vehicleId]
    localStorage.setItem(STORAGE_KEYS.vehicleOverrides, JSON.stringify(overrides))
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
}

// Función universal para actualizar cualquier vehículo (mock o user)
export function updateAnyVehicle(vehicleId: string, updates: Partial<Vehicle>): void {
    if (typeof window === 'undefined') return

    // Si es un vehículo de usuario, actualizarlo directamente
    if (vehicleId.startsWith('user_')) {
        updateUserVehicle(vehicleId, updates)
    } else {
        // Si es un mock, guardar como override
        setVehicleOverride(vehicleId, updates)
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function clearAllUserData(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.contacts)
    localStorage.removeItem(STORAGE_KEYS.leads)
    localStorage.removeItem(STORAGE_KEYS.vehicles)
    window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'all' } }))
}
