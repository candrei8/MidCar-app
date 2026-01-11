import { supabase } from '../supabase'
import type { Lead } from '@/types'

// Get all leads with joined data
export async function getLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            cliente:cliente_id (id, nombre, apellidos, email, telefono),
            vehiculo:vehiculo_id (id, marca, modelo, version, precio_venta, imagen_principal)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching leads:', error)
        throw error
    }
    return data
}

// Get lead by ID
export async function getLeadById(id: string) {
    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            cliente:cliente_id (*),
            vehiculo:vehiculo_id (*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching lead:', error)
        throw error
    }
    return data
}

// Get leads by status
export async function getLeadsByStatus(estado: string) {
    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            cliente:cliente_id (nombre, apellidos, telefono),
            vehiculo:vehiculo_id (marca, modelo, precio_venta, imagen_principal)
        `)
        .eq('estado', estado)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching leads by status:', error)
        throw error
    }
    return data
}

// Create lead
export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        throw error
    }
    return data
}

// Update lead
export async function updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating lead:', error)
        throw error
    }
    return data
}

// Update lead status
export async function updateLeadStatus(id: string, estado: string) {
    const updates: Record<string, unknown> = { estado }

    // If status is 'vendido' or 'perdido', set close date
    if (estado === 'vendido' || estado === 'perdido') {
        updates.fecha_cierre = new Date().toISOString()
    }

    const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating lead status:', error)
        throw error
    }
    return data
}

// Delete lead
export async function deleteLead(id: string) {
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting lead:', error)
        throw error
    }
    return true
}

// Get lead stats
export async function getLeadStats() {
    const { data, error } = await supabase
        .from('leads')
        .select('estado, probabilidad, presupuesto_cliente')

    if (error) {
        console.error('Error fetching lead stats:', error)
        throw error
    }

    const leads = data || []
    const activeLeads = leads.filter(l => !['vendido', 'perdido'].includes(l.estado))

    return {
        total: leads.length,
        activos: activeLeads.length,
        nuevos: leads.filter(l => l.estado === 'nuevo').length,
        contactados: leads.filter(l => l.estado === 'contactado').length,
        negociacion: leads.filter(l => l.estado === 'negociacion').length,
        vendidos: leads.filter(l => l.estado === 'vendido').length,
        perdidos: leads.filter(l => l.estado === 'perdido').length,
        valorPipeline: activeLeads.reduce((sum, l) =>
            sum + ((Number(l.presupuesto_cliente) || 0) * (Number(l.probabilidad) || 0) / 100), 0
        ),
    }
}

// Get leads pipeline (grouped by status)
export async function getLeadsPipeline() {
    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            cliente:cliente_id (nombre, apellidos, telefono),
            vehiculo:vehiculo_id (marca, modelo, precio_venta, imagen_principal)
        `)
        .not('estado', 'in', '("vendido","perdido")')
        .order('prioridad', { ascending: false })

    if (error) {
        console.error('Error fetching leads pipeline:', error)
        throw error
    }

    // Group by status
    const pipeline: Record<string, typeof data> = {
        nuevo: [],
        contactado: [],
        visita_agendada: [],
        prueba_programada: [],
        propuesta_enviada: [],
        negociacion: [],
    }

    data?.forEach(lead => {
        if (pipeline[lead.estado]) {
            pipeline[lead.estado].push(lead)
        }
    })

    return pipeline
}
