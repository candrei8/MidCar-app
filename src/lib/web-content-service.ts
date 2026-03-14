/**
 * Web Content Service - CRUD operations for website content management
 */

import { supabase, isSupabaseConfigured } from './supabase'

// ============================================
// Types
// ============================================

export interface WebContent {
  id: string
  seccion: string
  clave: string
  valor: string
  tipo: string
  orden: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface WebTestimonial {
  id: string
  nombre: string
  fecha: string
  rating: number
  texto: string
  imagen_url?: string
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface WebFAQ {
  id: string
  seccion: string
  pregunta: string
  respuesta: string
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface WebBenefit {
  id: string
  titulo: string
  descripcion: string
  icono?: string
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface WebConfig {
  id: string
  clave: string
  valor: string
  tipo: string
  descripcion?: string
  created_at: string
  updated_at: string
}

// ============================================
// Content Functions
// ============================================

export async function getContentBySection(seccion: string): Promise<WebContent[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('web_content')
    .select('*')
    .eq('seccion', seccion)
    .order('orden')

  if (error) {
    console.error('Error fetching content:', error)
    return []
  }

  return data || []
}

export async function updateContent(id: string, valor: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_content')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating content:', error)
    return false
  }

  return true
}

export async function updateContentByKey(seccion: string, clave: string, valor: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_content')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('seccion', seccion)
    .eq('clave', clave)

  if (error) {
    console.error('Error updating content:', error)
    return false
  }

  return true
}

// ============================================
// Config Functions
// ============================================

export async function getAllConfigs(): Promise<WebConfig[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('web_config')
    .select('*')
    .order('clave')

  if (error) {
    console.error('Error fetching configs:', error)
    return []
  }

  return data || []
}

export async function updateConfig(clave: string, valor: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_config')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('clave', clave)

  if (error) {
    console.error('Error updating config:', error)
    return false
  }

  return true
}

// ============================================
// Testimonials Functions
// ============================================

export async function getTestimonials(): Promise<WebTestimonial[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('web_testimonials')
    .select('*')
    .order('orden')

  if (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }

  return data || []
}

export async function createTestimonial(testimonial: Omit<WebTestimonial, 'id' | 'created_at' | 'updated_at'>): Promise<WebTestimonial | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('web_testimonials')
    .insert(testimonial)
    .select()
    .single()

  if (error) {
    console.error('Error creating testimonial:', error)
    return null
  }

  return data
}

export async function updateTestimonial(id: string, updates: Partial<WebTestimonial>): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_testimonials')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating testimonial:', error)
    return false
  }

  return true
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_testimonials')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting testimonial:', error)
    return false
  }

  return true
}

// ============================================
// Benefits Functions
// ============================================

export async function getBenefits(): Promise<WebBenefit[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('web_benefits')
    .select('*')
    .order('orden')

  if (error) {
    console.error('Error fetching benefits:', error)
    return []
  }

  return data || []
}

export async function createBenefit(benefit: Omit<WebBenefit, 'id' | 'created_at' | 'updated_at'>): Promise<WebBenefit | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('web_benefits')
    .insert(benefit)
    .select()
    .single()

  if (error) {
    console.error('Error creating benefit:', error)
    return null
  }

  return data
}

export async function updateBenefit(id: string, updates: Partial<WebBenefit>): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_benefits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating benefit:', error)
    return false
  }

  return true
}

export async function deleteBenefit(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_benefits')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting benefit:', error)
    return false
  }

  return true
}

// ============================================
// FAQs Functions
// ============================================

export async function getFAQs(seccion?: string): Promise<WebFAQ[]> {
  if (!isSupabaseConfigured) return []

  let query = supabase
    .from('web_faqs')
    .select('*')
    .order('orden')

  if (seccion) {
    query = query.eq('seccion', seccion)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }

  return data || []
}

export async function createFAQ(faq: Omit<WebFAQ, 'id' | 'created_at' | 'updated_at'>): Promise<WebFAQ | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('web_faqs')
    .insert(faq)
    .select()
    .single()

  if (error) {
    console.error('Error creating FAQ:', error)
    return null
  }

  return data
}

export async function updateFAQ(id: string, updates: Partial<WebFAQ>): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_faqs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating FAQ:', error)
    return false
  }

  return true
}

export async function deleteFAQ(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('web_faqs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting FAQ:', error)
    return false
  }

  return true
}
