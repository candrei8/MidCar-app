/**
 * Servicio de gestión de empresas vendedoras
 * CRUD con persistencia en Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase'
import type { EmpresaVendedora } from '@/types'

// Empresas de ejemplo iniciales (solo se usan si no hay datos en Supabase)
const DEFAULT_EMPRESAS: EmpresaVendedora[] = [
    {
        id: 'ejemplo-loredana',
        nombre_comercial: 'Loredana SLU',
        razon_social: 'Loredana Sociedad Limitada Unipersonal',
        cif: 'B12345678',
        direccion: 'Calle Ejemplo 1',
        codigo_postal: '28001',
        localidad: 'Madrid',
        provincia: 'Madrid',
        telefono: '912 000 000',
        email: 'info@loredana.example',
        web: '',
        logo: '',
        activa: true,
        es_ejemplo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
]

// Cache en memoria para evitar llamadas repetidas
let empresasCache: EmpresaVendedora[] | null = null

/**
 * Invalida el cache
 */
function invalidateCache() {
    empresasCache = null
}

/**
 * Transforma datos de DB a formato de la app
 */
function transformFromDB(data: Record<string, unknown>): EmpresaVendedora {
    return {
        id: data.id as string,
        nombre_comercial: data.nombre_comercial as string,
        razon_social: data.razon_social as string,
        cif: data.cif as string,
        direccion: data.direccion as string,
        codigo_postal: data.codigo_postal as string,
        localidad: data.localidad as string,
        provincia: data.provincia as string,
        telefono: (data.telefono as string) || '',
        email: (data.email as string) || '',
        web: (data.web as string) || '',
        logo: (data.logo as string) || '',
        activa: data.activa as boolean,
        es_ejemplo: (data.es_ejemplo as boolean) || false,
        created_at: data.created_at as string,
        updated_at: data.updated_at as string,
    }
}

/**
 * Inicializa empresas de ejemplo en Supabase si no hay ninguna
 */
export async function initDefaultEmpresas(): Promise<void> {
    if (!isSupabaseConfigured) return

    const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .limit(1)

    if (error) {
        console.error('Error checking empresas:', error)
        return
    }

    // Si no hay empresas, insertar las de ejemplo
    if (!data || data.length === 0) {
        for (const empresa of DEFAULT_EMPRESAS) {
            await supabase.from('empresas').insert({
                nombre_comercial: empresa.nombre_comercial,
                razon_social: empresa.razon_social,
                cif: empresa.cif,
                direccion: empresa.direccion,
                codigo_postal: empresa.codigo_postal,
                localidad: empresa.localidad,
                provincia: empresa.provincia,
                telefono: empresa.telefono,
                email: empresa.email,
                web: empresa.web,
                logo: empresa.logo,
                activa: empresa.activa,
                es_ejemplo: empresa.es_ejemplo,
            })
        }
        invalidateCache()
    }
}

/**
 * Obtiene todas las empresas de Supabase
 */
export async function getEmpresas(): Promise<EmpresaVendedora[]> {
    if (!isSupabaseConfigured) return DEFAULT_EMPRESAS

    // Usar cache si existe
    if (empresasCache !== null) return empresasCache

    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nombre_comercial')

    if (error) {
        console.error('Error fetching empresas:', error)
        return DEFAULT_EMPRESAS
    }

    const empresas = (data || []).map(transformFromDB)
    empresasCache = empresas
    return empresas
}

/**
 * Obtiene solo las empresas activas (para usar en dropdowns)
 */
export async function getEmpresasActivas(): Promise<EmpresaVendedora[]> {
    const empresas = await getEmpresas()
    return empresas.filter(e => e.activa)
}

/**
 * Obtiene una empresa por su ID
 */
export async function getEmpresaById(id: string): Promise<EmpresaVendedora | null> {
    if (!isSupabaseConfigured) {
        return DEFAULT_EMPRESAS.find(e => e.id === id) || null
    }

    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching empresa:', error)
        return null
    }

    return data ? transformFromDB(data) : null
}

/**
 * Crea una nueva empresa
 */
export async function createEmpresa(data: Omit<EmpresaVendedora, 'id' | 'created_at' | 'updated_at' | 'es_ejemplo'>): Promise<EmpresaVendedora | null> {
    if (!isSupabaseConfigured) {
        console.error('Supabase not configured')
        return null
    }

    const { data: newData, error } = await supabase
        .from('empresas')
        .insert({
            nombre_comercial: data.nombre_comercial,
            razon_social: data.razon_social,
            cif: data.cif,
            direccion: data.direccion,
            codigo_postal: data.codigo_postal,
            localidad: data.localidad,
            provincia: data.provincia,
            telefono: data.telefono || null,
            email: data.email || null,
            web: data.web || null,
            logo: data.logo || null,
            activa: data.activa ?? true,
            es_ejemplo: false,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating empresa:', error)
        if (error.code === '23505') { // Unique constraint violation
            throw new Error('Ya existe una empresa con ese CIF')
        }
        return null
    }

    invalidateCache()
    return newData ? transformFromDB(newData) : null
}

/**
 * Actualiza una empresa existente
 */
export async function updateEmpresa(id: string, data: Partial<EmpresaVendedora>): Promise<EmpresaVendedora | null> {
    if (!isSupabaseConfigured) return null

    const updates: Record<string, unknown> = {}
    if (data.nombre_comercial !== undefined) updates.nombre_comercial = data.nombre_comercial
    if (data.razon_social !== undefined) updates.razon_social = data.razon_social
    if (data.cif !== undefined) updates.cif = data.cif
    if (data.direccion !== undefined) updates.direccion = data.direccion
    if (data.codigo_postal !== undefined) updates.codigo_postal = data.codigo_postal
    if (data.localidad !== undefined) updates.localidad = data.localidad
    if (data.provincia !== undefined) updates.provincia = data.provincia
    if (data.telefono !== undefined) updates.telefono = data.telefono || null
    if (data.email !== undefined) updates.email = data.email || null
    if (data.web !== undefined) updates.web = data.web || null
    if (data.logo !== undefined) updates.logo = data.logo || null
    if (data.activa !== undefined) updates.activa = data.activa
    updates.updated_at = new Date().toISOString()

    const { data: updatedData, error } = await supabase
        .from('empresas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating empresa:', error)
        if (error.code === '23505') {
            throw new Error('Ya existe otra empresa con ese CIF')
        }
        return null
    }

    invalidateCache()
    return updatedData ? transformFromDB(updatedData) : null
}

/**
 * Elimina una empresa
 */
export async function deleteEmpresa(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting empresa:', error)
        return false
    }

    invalidateCache()
    return true
}

/**
 * Activa/desactiva una empresa
 */
export async function toggleEmpresaActiva(id: string): Promise<EmpresaVendedora | null> {
    const empresa = await getEmpresaById(id)
    if (!empresa) return null

    return updateEmpresa(id, { activa: !empresa.activa })
}

/**
 * Verifica si hay empresas configuradas (no de ejemplo)
 */
export async function hasRealEmpresas(): Promise<boolean> {
    const empresas = await getEmpresas()
    return empresas.some(e => !e.es_ejemplo)
}

/**
 * Obtiene el número de empresas activas
 */
export async function countEmpresasActivas(): Promise<number> {
    const empresas = await getEmpresasActivas()
    return empresas.length
}

/**
 * Exporta las empresas a JSON (para backup)
 */
export async function exportEmpresas(): Promise<string> {
    const empresas = await getEmpresas()
    return JSON.stringify(empresas, null, 2)
}

/**
 * Resetea las empresas a las de ejemplo
 */
export async function resetToDefault(): Promise<void> {
    if (!isSupabaseConfigured) return

    // Eliminar todas las empresas
    await supabase.from('empresas').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insertar las de ejemplo
    for (const empresa of DEFAULT_EMPRESAS) {
        await supabase.from('empresas').insert({
            nombre_comercial: empresa.nombre_comercial,
            razon_social: empresa.razon_social,
            cif: empresa.cif,
            direccion: empresa.direccion,
            codigo_postal: empresa.codigo_postal,
            localidad: empresa.localidad,
            provincia: empresa.provincia,
            telefono: empresa.telefono,
            email: empresa.email,
            web: empresa.web,
            logo: empresa.logo,
            activa: empresa.activa,
            es_ejemplo: empresa.es_ejemplo,
        })
    }

    invalidateCache()
}
