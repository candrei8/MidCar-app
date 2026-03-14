import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'web-images'

/**
 * Compress an image file using canvas before upload.
 */
function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img

                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    resolve(file)
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob)
                        else resolve(file)
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => resolve(file)
            img.src = reader.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Upload a vehicle image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadVehicleImage(
    file: File,
    vehicleStockId: string,
    index: number
): Promise<string> {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase not configured')
    }

    const compressed = await compressImage(file)
    const timestamp = Date.now()
    const filePath = `vehicles/${vehicleStockId}/${timestamp}-${index}.jpg`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, compressed, {
            cacheControl: '31536000',
            contentType: 'image/jpeg',
            upsert: false,
        })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath)

    return publicUrl
}

/**
 * Delete a vehicle image from Supabase Storage by its public URL.
 */
export async function deleteVehicleImage(url: string): Promise<void> {
    if (!isSupabaseConfigured || !url.includes('web-images')) return

    const path = url.split('/web-images/')[1]
    if (!path) return

    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) {
        console.error('Error deleting vehicle image:', error)
    }
}
