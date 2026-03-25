import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'web-images'

/**
 * Upload a vehicle document (PDF or image) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadVehicleDocument(
    file: File,
    vehicleStockId: string,
    docType: string
): Promise<string> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured')
    }

    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const filePath = `vehicles/${vehicleStockId}/docs/${docType}-${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
            cacheControl: '31536000',
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

    return publicUrl
}

/**
 * Delete a vehicle document from Supabase Storage by its public URL.
 */
export async function deleteVehicleDocument(url: string): Promise<void> {
    if (!isSupabaseConfigured || !url.includes('web-images')) return

    const path = url.split('/web-images/')[1]
    if (!path) return

    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) {
        console.error('Error deleting vehicle document:', error)
    }
}
