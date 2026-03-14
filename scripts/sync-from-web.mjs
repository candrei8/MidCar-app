/**
 * Sync vehicles from midcar_web static data into dashboard Supabase
 *
 * Reads the 78 available vehicles from midcar_web/src/data/vehicles.ts
 * and imports them with all images, descriptions, features etc.
 *
 * Usage: node scripts/sync-from-web.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

// Path to midcar_web data files
const WEB_DIR = resolve('C:/Users/Andrei/Documents/midcar_web/src/data')

// ---- Parse static TS files ----

function parseVehiclesTS() {
    const raw = readFileSync(resolve(WEB_DIR, 'vehicles.ts'), 'utf-8')

    // Extract vehicle objects using regex - each vehicle block starts with { and id:
    const vehicles = []

    // Find the array content between "export const vehicles: Vehicle[] = [" and the closing "]"
    const arrayMatch = raw.match(/export const vehicles:\s*Vehicle\[\]\s*=\s*\[([\s\S]*)\]/)
    if (!arrayMatch) {
        console.error('Could not find vehicles array in vehicles.ts')
        return []
    }

    const arrayContent = arrayMatch[1]

    // Split by object boundaries - each vehicle starts with "  {"
    const objectBlocks = arrayContent.split(/\n  \{/)

    for (const block of objectBlocks) {
        if (!block.trim()) continue

        const fullBlock = '{' + block

        // Extract fields with regex
        const get = (field) => {
            const m = fullBlock.match(new RegExp(`${field}:\\s*"([^"]*)"`, 's'))
            return m ? m[1] : null
        }
        const getNum = (field) => {
            const m = fullBlock.match(new RegExp(`${field}:\\s*(\\d+)`))
            return m ? parseInt(m[1]) : null
        }
        const getBool = (field) => {
            const m = fullBlock.match(new RegExp(`${field}:\\s*(true|false)`))
            return m ? m[1] === 'true' : false
        }

        const id = get('id')
        if (!id) continue

        const status = get('status')

        // Extract description (can contain newlines and quotes)
        let description = null
        const descMatch = fullBlock.match(/description:\s*"([\s\S]*?)",\n\s+color/)
        if (descMatch) {
            description = descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }

        // Extract features array
        const features = []
        const featMatch = fullBlock.match(/features:\s*\[([\s\S]*?)\]/)
        if (featMatch) {
            const featStr = featMatch[1]
            const items = featStr.match(/"([^"]*)"/g)
            if (items) {
                for (const item of items) {
                    features.push(item.replace(/"/g, ''))
                }
            }
        }

        // Extract extras array
        const extras = []
        const extrasMatch = fullBlock.match(/extras:\s*\[([\s\S]*?)\]/)
        if (extrasMatch) {
            const extStr = extrasMatch[1]
            const items = extStr.match(/"([^"]*)"/g)
            if (items) {
                for (const item of items) {
                    extras.push(item.replace(/"/g, ''))
                }
            }
        }

        // Extract originalPrice
        const originalPrice = getNum('originalPrice')

        vehicles.push({
            id,
            status,
            brand: get('brand'),
            model: get('model'),
            title: get('title'),
            price: getNum('price'),
            originalPrice,
            km: getNum('km'),
            year: getNum('year'),
            cv: getNum('cv'),
            fuel: get('fuel'),
            transmission: get('transmission'),
            bodyType: get('bodyType'),
            label: get('label'),
            featured: getBool('featured'),
            onSale: getBool('onSale'),
            ivaDeducible: getBool('ivaDeducible'),
            monthlyPayment: getNum('monthlyPayment'),
            description,
            color: get('color'),
            seats: getNum('seats'),
            doors: getNum('doors'),
            features,
            extras,
        })
    }

    return vehicles
}

function parseVehicleImagesTS() {
    const raw = readFileSync(resolve(WEB_DIR, 'vehicleImages.ts'), 'utf-8')

    // Parse customFirstImages (main image per vehicle)
    const mainImages = {}
    const mainMatch = raw.match(/export const customFirstImages:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\n\}/)
    if (mainMatch) {
        const entries = mainMatch[1].matchAll(/"(\d+)":\s*"([^"]+)"/g)
        for (const entry of entries) {
            mainImages[entry[1]] = entry[2]
        }
    }

    // Parse vehicleAllImages (all images per vehicle)
    const allImages = {}
    const allMatch = raw.match(/export const vehicleAllImages:\s*Record<string,\s*string\[\]>\s*=\s*\{([\s\S]*?)\n\}/)
    if (allMatch) {
        // Each entry: "id": ["url1", "url2", ...]
        const entryRegex = /"(\d+)":\s*\[([\s\S]*?)\]/g
        let m
        while ((m = entryRegex.exec(allMatch[1])) !== null) {
            const vehicleId = m[1]
            const urlsStr = m[2]
            const urls = []
            const urlRegex = /"([^"]+)"/g
            let u
            while ((u = urlRegex.exec(urlsStr)) !== null) {
                urls.push(u[1])
            }
            if (urls.length > 0) {
                allImages[vehicleId] = urls
            }
        }
    }

    return { mainImages, allImages }
}

// ---- Fuel / transmission mapping ----

function mapFuelToDb(fuel) {
    const map = {
        'Diesel': 'diesel',
        'Gasolina': 'gasolina',
        'Híbrido': 'hibrido',
        'Eléctrico': 'electrico',
        'Gas': 'glp',
    }
    return map[fuel] || 'diesel'
}

function mapTransmissionToDb(trans) {
    const map = {
        'Manual': 'manual',
        'Automático': 'automatico',
    }
    return map[trans] || 'manual'
}

function mapLabelToDb(label) {
    if (!label) return 'SIN'
    if (label === '0') return '0'
    return label.toUpperCase()
}

// ---- Main ----

async function main() {
    console.log('=========================================')
    console.log('  SYNC VEHICLES FROM MIDCAR_WEB')
    console.log('=========================================\n')

    // 1. Parse vehicles from TS files
    console.log('Parsing vehicles.ts...')
    const allVehicles = parseVehiclesTS()
    console.log(`Found ${allVehicles.length} total vehicles`)

    const disponibles = allVehicles.filter(v => v.status === 'disponible')
    console.log(`Found ${disponibles.length} disponible vehicles\n`)

    // 2. Parse images
    console.log('Parsing vehicleImages.ts...')
    const { mainImages, allImages } = parseVehicleImagesTS()
    console.log(`Main images: ${Object.keys(mainImages).length}`)
    console.log(`All images: ${Object.keys(allImages).length}\n`)

    // 3. Clean existing vehicles from Supabase
    console.log('--- Cleaning existing vehicles ---')

    // Clean related tables first (FK constraints)
    for (const table of ['contratos', 'facturas', 'sales', 'leads', 'polizas_seguro']) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) console.log(`  Note cleaning ${table}: ${error.message}`)
        else console.log(`  - ${table} cleaned`)
    }

    const { error: delError } = await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delError) console.log(`  Note cleaning vehicles: ${delError.message}`)
    else console.log('  - vehicles cleaned')

    console.log('')

    // 4. Insert disponible vehicles
    console.log(`--- Inserting ${disponibles.length} vehicles ---\n`)

    let imported = 0
    let errors = 0

    for (const v of disponibles) {
        try {
            // Get images for this vehicle
            const images = allImages[v.id] || (mainImages[v.id] ? [mainImages[v.id]] : [])
            const mainImage = mainImages[v.id] || images[0] || null

            // Build imagenes JSONB array
            const imagenesJson = images.map((url, i) => ({
                url,
                es_principal: url === mainImage,
                orden: i,
            }))

            // Combine features + extras as equipamiento
            const equipamiento = [...(v.features || []), ...(v.extras || [])]

            // Calculate descuento from originalPrice
            const descuento = v.originalPrice ? v.originalPrice - v.price : 0

            const vehicleData = {
                // IDs
                stock_id: `STK-${v.id}`,
                matricula: `WEB-${v.id}`, // placeholder - not in web data

                // Status
                estado: 'disponible',
                destacado: v.featured || false,
                en_oferta: descuento > 0,

                // Basic info
                marca: v.brand,
                modelo: v.model,
                version: null,
                año_fabricacion: v.year,
                año_matriculacion: v.year,

                // Technical
                potencia_cv: v.cv || null,
                potencia_kw: v.cv ? Math.round(v.cv * 0.7355) : null,
                combustible: mapFuelToDb(v.fuel),
                transmision: mapTransmissionToDb(v.transmission),
                etiqueta_dgt: mapLabelToDb(v.label),
                tipo_carroceria: v.bodyType || null,

                // Body
                num_puertas: v.doors || null,
                num_plazas: v.seats || null,
                color_exterior: v.color || null,

                // History
                kilometraje: v.km || 0,
                num_propietarios: 1,
                es_nacional: true,
                primera_mano: true,

                // Commercial
                precio_compra: 0,
                gastos_compra: 0,
                coste_reparaciones: 0,
                precio_venta: v.price || 0,
                descuento: descuento,
                fecha_entrada_stock: new Date().toISOString().split('T')[0],

                // Warranty
                garantia_meses: 12,
                tipo_garantia: 'Garantía 12 meses',

                // Images
                imagen_principal: mainImage,
                imagenes: imagenesJson,

                // Description
                descripcion: v.description || null,

                // Equipment
                equipamiento: equipamiento,

                // Web sync
                url_web: null,
                datos_sincronizados: true,
                ultima_sincronizacion: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('vehicles')
                .insert(vehicleData)

            if (error) {
                console.error(`  ERROR ${v.brand} ${v.model}: ${error.message}`)
                errors++
            } else {
                imported++
                const imgCount = images.length
                const hasDesc = v.description ? 'YES' : 'NO'
                console.log(`  [${imported}] ${v.brand} ${v.model} (${v.year}) — ${imgCount} imgs, desc: ${hasDesc}`)
            }

        } catch (err) {
            console.error(`  FATAL ERROR ${v.id}: ${err.message}`)
            errors++
        }
    }

    // 5. Summary
    console.log('\n=========================================')
    console.log('  SYNC COMPLETE')
    console.log('=========================================')
    console.log(`Imported: ${imported}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total images stored: ${disponibles.reduce((sum, v) => {
        const imgs = allImages[v.id] || (mainImages[v.id] ? [mainImages[v.id]] : [])
        return sum + imgs.length
    }, 0)}`)
    console.log('=========================================\n')
}

main().catch(console.error)
