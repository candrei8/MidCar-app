import { supabase } from '../supabase'

export interface InteractionRecord {
    id?: string
    contact_id: string | null
    lead_id?: string | null
    tipo: string
    fecha: string
    hora: string
    duracion_minutos?: number | null
    descripcion?: string | null
    resultado?: string | null
    seguimiento_fecha?: string | null
    seguimiento_hora?: string | null
    siguiente_accion?: string | null
    fecha_siguiente_accion?: string | null
    realizada_por?: string | null
    created_at?: string
}

// Get all interactions for a contact
export async function getInteractionsByContact(contactId: string) {
    const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })

    if (error) {
        console.error('Error fetching interactions:', error)
        throw error
    }
    return data as InteractionRecord[]
}

// Get all interactions for a lead
export async function getInteractionsByLead(leadId: string) {
    const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false })

    if (error) {
        console.error('Error fetching lead interactions:', error)
        throw error
    }
    return data as InteractionRecord[]
}

// Create interaction
export async function createInteraction(interaction: Omit<InteractionRecord, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('interactions')
        .insert(interaction)
        .select()
        .single()

    if (error) {
        console.error('Error creating interaction:', error)
        throw error
    }

    // Update contact's last interaction timestamp
    if (interaction.contact_id) {
        await supabase
            .from('contacts')
            .update({
                ultima_interaccion: new Date().toISOString(),
                fecha_ultimo_contacto: new Date().toISOString()
            })
            .eq('id', interaction.contact_id)
    }

    // Update lead's last interaction timestamp
    if (interaction.lead_id) {
        await supabase
            .from('leads')
            .update({ ultima_interaccion: new Date().toISOString() })
            .eq('id', interaction.lead_id)
    }

    return data as InteractionRecord
}

// Delete interaction
export async function deleteInteraction(id: string) {
    const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting interaction:', error)
        throw error
    }
    return true
}

// Get recent interactions
export async function getRecentInteractions(limit: number = 10) {
    const { data, error } = await supabase
        .from('interactions')
        .select(`
            *,
            contacts:contact_id (nombre, apellidos, telefono),
            leads:lead_id (estado)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching recent interactions:', error)
        throw error
    }
    return data
}

// Get interaction stats
export async function getInteractionStats() {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data, error } = await supabase
        .from('interactions')
        .select('tipo, fecha')
        .gte('fecha', weekAgo)

    if (error) {
        console.error('Error fetching interaction stats:', error)
        throw error
    }

    const interactions = data || []

    return {
        total: interactions.length,
        hoy: interactions.filter(i => i.fecha === today).length,
        llamadas: interactions.filter(i => i.tipo.includes('llamada')).length,
        emails: interactions.filter(i => i.tipo.includes('email')).length,
        whatsapp: interactions.filter(i => i.tipo === 'whatsapp').length,
        visitas: interactions.filter(i => i.tipo === 'visita').length,
    }
}
