import { supabase } from '../supabase'
import type { Vehicle } from '@/types'

// Get all vehicles
export async function getVehicles() {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching vehicles:', error)
        throw error
    }
    return data as Vehicle[]
}

// Get vehicle by ID
export async function getVehicleById(id: string) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching vehicle:', error)
        throw error
    }
    return data as Vehicle
}

// Get vehicles by status
export async function getVehiclesByStatus(estado: string) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('estado', estado)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching vehicles by status:', error)
        throw error
    }
    return data as Vehicle[]
}

// Create vehicle
export async function createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'margen_bruto' | 'dias_en_stock'>) {
    const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single()

    if (error) {
        console.error('Error creating vehicle:', error)
        throw error
    }
    return data as Vehicle
}

// Update vehicle
export async function updateVehicle(id: string, updates: Partial<Vehicle>) {
    const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating vehicle:', error)
        throw error
    }
    return data as Vehicle
}

// Delete vehicle
export async function deleteVehicle(id: string) {
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting vehicle:', error)
        throw error
    }
    return true
}

// Get vehicle stats
export async function getVehicleStats() {
    const { data, error } = await supabase
        .from('vehicles')
        .select('estado, precio_venta, precio_compra, gastos_compra, coste_reparaciones')

    if (error) {
        console.error('Error fetching vehicle stats:', error)
        throw error
    }

    const vehicles = data || []

    const stats = {
        total: vehicles.length,
        disponibles: vehicles.filter(v => v.estado === 'disponible').length,
        reservados: vehicles.filter(v => v.estado === 'reservado').length,
        vendidos: vehicles.filter(v => v.estado === 'vendido').length,
        enTaller: vehicles.filter(v => v.estado === 'taller').length,
        valorStock: vehicles
            .filter(v => v.estado === 'disponible' || v.estado === 'reservado')
            .reduce((sum, v) => sum + (Number(v.precio_venta) || 0), 0),
        costeStock: vehicles
            .filter(v => v.estado === 'disponible' || v.estado === 'reservado')
            .reduce((sum, v) => sum + (Number(v.precio_compra) || 0) + (Number(v.gastos_compra) || 0) + (Number(v.coste_reparaciones) || 0), 0),
    }

    return stats
}

// Search vehicles
export async function searchVehicles(query: string) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .or(`marca.ilike.%${query}%,modelo.ilike.%${query}%,matricula.ilike.%${query}%`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error searching vehicles:', error)
        throw error
    }
    return data as Vehicle[]
}
