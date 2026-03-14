/**
 * Upload photos from local dir to Supabase Storage for a vehicle
 * Usage: node scripts/upload-photos-batch.mjs <photo_dir> <stock_id>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)
const BUCKET = 'web-images'

async function uploadForVehicle(photoDir, stockId) {
    const { data: vehicle, error: vErr } = await supabase
        .from('vehicles')
        .select('id, marca, modelo')
        .eq('stock_id', stockId)
        .single()

    if (vErr || !vehicle) {
        console.error(`Vehicle ${stockId} not found:`, vErr?.message)
        return
    }
    console.log(`\n=== ${vehicle.marca} ${vehicle.modelo} ===`)

    const files = readdirSync(photoDir)
        .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => {
            const numA = parseInt(a.match(/(\d+)/)?.[1] || '0')
            const numB = parseInt(b.match(/(\d+)/)?.[1] || '0')
            return numA - numB
        })

    console.log(`${files.length} photos to upload\n`)

    const imagenesArray = []
    const baseId = stockId.replace('STK-', '')

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileBuffer = readFileSync(join(photoDir, file))
        const storagePath = `vehicles/${baseId}/${Date.now()}-${i}.jpg`

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, {
                cacheControl: '31536000',
                contentType: 'image/jpeg',
                upsert: false,
            })

        if (error) {
            console.error(`  ERROR ${file}: ${error.message}`)
            continue
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(storagePath)

        imagenesArray.push({ url: publicUrl, es_principal: i === 0, orden: i })
        console.log(`  [${i + 1}] ${file}`)
    }

    const { error: updateErr } = await supabase
        .from('vehicles')
        .update({
            imagen_principal: imagenesArray[0]?.url || null,
            imagenes: imagenesArray,
        })
        .eq('id', vehicle.id)

    if (updateErr) {
        console.error('Update error:', updateErr.message)
    } else {
        console.log(`\nDone! ${imagenesArray.length} photos saved.`)
    }
}

// Run both
const BASE = 'C:/Users/Andrei/Documents/MidCar'

await uploadForVehicle(resolve(BASE, 'tmp_mondeo'), 'STK-1202171353904')
await uploadForVehicle(resolve(BASE, 'tmp_focus'), 'STK-1902164619196')

console.log('\n=== ALL DONE ===')
