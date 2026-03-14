/**
 * Upload VW Caddy photos from zip to Supabase Storage
 * and update the vehicle record with new image URLs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

const PHOTO_DIR = resolve('C:/Users/Andrei/Documents/MidCar/tmp_caddy')
const VEHICLE_STOCK_ID = 'STK-1902162642681'
const BUCKET = 'web-images'

async function main() {
    console.log('=== Upload VW Caddy Photos ===\n')

    // 1. Get vehicle ID
    const { data: vehicle, error: vErr } = await supabase
        .from('vehicles')
        .select('id, stock_id, marca, modelo')
        .eq('stock_id', VEHICLE_STOCK_ID)
        .single()

    if (vErr || !vehicle) {
        console.error('Vehicle not found:', vErr?.message)
        return
    }
    console.log(`Vehicle: ${vehicle.marca} ${vehicle.modelo} (${vehicle.id})\n`)

    // 2. Read photo files sorted
    const files = readdirSync(PHOTO_DIR)
        .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))
        .sort((a, b) => {
            // Extract number from filename for natural sorting
            const numA = parseInt(a.match(/(\d+)/)?.[1] || '0')
            const numB = parseInt(b.match(/(\d+)/)?.[1] || '0')
            return numA - numB
        })

    console.log(`Found ${files.length} photos to upload\n`)

    // 3. Upload each photo to Storage
    const imagenesArray = []
    let uploaded = 0

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = join(PHOTO_DIR, file)
        const fileBuffer = readFileSync(filePath)

        const storagePath = `vehicles/${VEHICLE_STOCK_ID.replace('STK-', '')}/${Date.now()}-${i}.jpg`

        const { error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, {
                cacheControl: '31536000',
                contentType: 'image/jpeg',
                upsert: false,
            })

        if (uploadErr) {
            console.error(`  ERROR uploading ${file}: ${uploadErr.message}`)
            continue
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath)

        imagenesArray.push({
            url: publicUrl,
            es_principal: i === 0,
            orden: i,
        })

        uploaded++
        console.log(`  [${uploaded}] ${file} -> uploaded`)
    }

    console.log(`\nUploaded ${uploaded}/${files.length} photos`)

    // 4. Update vehicle with new images (replace old Azure ones)
    const imagenPrincipal = imagenesArray[0]?.url || null

    const { error: updateErr } = await supabase
        .from('vehicles')
        .update({
            imagen_principal: imagenPrincipal,
            imagenes: imagenesArray,
        })
        .eq('id', vehicle.id)

    if (updateErr) {
        console.error('Error updating vehicle:', updateErr.message)
    } else {
        console.log(`\nVehicle updated with ${imagenesArray.length} new photos!`)
        console.log(`Main image: ${imagenPrincipal}`)
    }
}

main().catch(console.error)
