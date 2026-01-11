import { supabase } from '../supabase'
import type { Contact } from '@/types'

// Get all contacts
export async function getContacts() {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts:', error)
        throw error
    }
    return data as Contact[]
}

// Get contact by ID
export async function getContactById(id: string) {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching contact:', error)
        throw error
    }
    return data as Contact
}

// Get contacts by status
export async function getContactsByStatus(estado: string) {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('estado', estado)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts by status:', error)
        throw error
    }
    return data as Contact[]
}

// Create contact
export async function createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single()

    if (error) {
        console.error('Error creating contact:', error)
        throw error
    }
    return data as Contact
}

// Update contact
export async function updateContact(id: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating contact:', error)
        throw error
    }
    return data as Contact
}

// Delete contact
export async function deleteContact(id: string) {
    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting contact:', error)
        throw error
    }
    return true
}

// Get contact stats
export async function getContactStats() {
    const { data, error } = await supabase
        .from('contacts')
        .select('estado')

    if (error) {
        console.error('Error fetching contact stats:', error)
        throw error
    }

    const contacts = data || []

    return {
        total: contacts.length,
        pendientes: contacts.filter(c => c.estado === 'pendiente').length,
        comunicados: contacts.filter(c => c.estado === 'comunicado').length,
        enTramite: contacts.filter(c => c.estado === 'tramite').length,
        reservados: contacts.filter(c => c.estado === 'reservado').length,
        cerrados: contacts.filter(c => c.estado === 'cerrado').length,
    }
}

// Search contacts
export async function searchContacts(query: string) {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`nombre.ilike.%${query}%,apellidos.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error searching contacts:', error)
        throw error
    }
    return data as Contact[]
}

// Update contact last interaction
export async function updateContactLastInteraction(contactId: string) {
    const { error } = await supabase
        .from('contacts')
        .update({
            ultima_interaccion: new Date().toISOString(),
            fecha_ultimo_contacto: new Date().toISOString()
        })
        .eq('id', contactId)

    if (error) {
        console.error('Error updating contact last interaction:', error)
        throw error
    }
    return true
}
