/**
 * Extract descriptions from midcar_web vehicles.ts and update Supabase
 * Uses a smarter parser that handles multiline strings
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

const WEB_DIR = resolve('C:/Users/Andrei/Documents/midcar_web/src/data')

function extractDescriptions() {
    const raw = readFileSync(resolve(WEB_DIR, 'vehicles.ts'), 'utf-8')
    const results = {}

    // For each vehicle, find its id and description
    // Pattern: id: "XXXXX", ... description: "...", color:
    // The description field value starts with " and ends with ", before the next field

    // Split file into vehicle blocks by looking for `id: "`
    const lines = raw.split('\n')
    let currentId = null
    let inDescription = false
    let descriptionParts = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Detect vehicle ID
        const idMatch = line.match(/^\s+id:\s*"(\d+)"/)
        if (idMatch) {
            currentId = idMatch[1]
        }

        // Detect description start
        if (currentId && line.match(/^\s+description:\s*"/)) {
            inDescription = true
            descriptionParts = []

            // Check if description ends on the same line
            const fullMatch = line.match(/^\s+description:\s*"([\s\S]*)",?\s*$/)
            if (fullMatch) {
                descriptionParts.push(fullMatch[1])
                results[currentId] = descriptionParts.join('\n').replace(/\\n/g, '\n').replace(/\\"/g, '"')
                inDescription = false
            } else {
                // Starts but doesn't end - grab content after description: "
                const startMatch = line.match(/^\s+description:\s*"(.*)/)
                if (startMatch) {
                    descriptionParts.push(startMatch[1])
                }
            }
            continue
        }

        if (inDescription) {
            // Check if this line ends the description
            if (line.match(/^.*",?\s*$/)) {
                const endMatch = line.match(/^(.*)"/)
                if (endMatch) {
                    descriptionParts.push(endMatch[1])
                }
                results[currentId] = descriptionParts.join('\n').replace(/\\n/g, '\n').replace(/\\"/g, '"')
                inDescription = false
            } else {
                descriptionParts.push(line)
            }
        }

        // Detect status to know if this vehicle is disponible
        const statusMatch = line.match(/^\s+status:\s*"(\w+)"/)
        if (statusMatch && currentId) {
            if (statusMatch[1] !== 'disponible') {
                delete results[currentId]
            }
        }
    }

    return results
}

async function main() {
    console.log('Extracting descriptions...')
    const descriptions = extractDescriptions()
    const ids = Object.keys(descriptions)
    console.log(`Found ${ids.length} vehicles with descriptions\n`)

    // Get all vehicles from Supabase to match by stock_id
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, stock_id')

    if (!vehicles) {
        console.error('Could not fetch vehicles')
        return
    }

    let updated = 0
    for (const v of vehicles) {
        // stock_id is "STK-{originalId}"
        const originalId = v.stock_id.replace('STK-', '')
        if (descriptions[originalId]) {
            const desc = descriptions[originalId]
            const { error } = await supabase
                .from('vehicles')
                .update({ descripcion: desc })
                .eq('id', v.id)

            if (error) {
                console.error(`Error updating ${v.id}: ${error.message}`)
            } else {
                updated++
                console.log(`  Updated ${originalId} — ${desc.substring(0, 50)}...`)
            }
        }
    }

    console.log(`\nUpdated ${updated} vehicles with descriptions`)
}

main().catch(console.error)
