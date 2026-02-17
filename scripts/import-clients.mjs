/**
 * Script para importar clientes desde CSV a Supabase
 *
 * Uso: node scripts/import-clients.mjs <ruta-al-csv>
 * Ejemplo: node scripts/import-clients.mjs "C:\Users\Andrei\Downloads\midcar.clients.csv"
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de tipo cliente
function mapTipoCliente(tipo) {
    if (!tipo) return 'particular'
    const t = tipo.toLowerCase().trim()
    if (t.includes('empresa') || t.includes('autonomo') || t.includes('sociedad')) return 'empresa'
    return 'particular'
}

// Leer CSV
async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const records = []
        createReadStream(filePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            }))
            .on('data', (record) => records.push(record))
            .on('end', () => resolve(records))
            .on('error', reject)
    })
}

// Limpiar tabla de clientes
async function cleanTable() {
    console.log('\n--- Limpiando tabla clients ---')

    const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.log('Nota al limpiar clients:', error.message)
    else console.log('- Tabla clients limpiada')

    console.log('Tabla limpia.\n')
}

// Importar clientes
async function importClients(records) {
    console.log(`\n--- Importando ${records.length} clientes ---\n`)

    let imported = 0
    let errors = 0

    for (const record of records) {
        try {
            const telefono = record.telefono?.trim() || ''
            const email = record.email?.trim() || ''
            const nombre = record.nombre?.trim() || ''

            // Saltar si no hay telefono
            if (!telefono) {
                console.log(`Saltando cliente sin telefono: ${nombre || 'Sin nombre'}`)
                continue
            }

            // Obtener datos de facturación activa (la primera que esté activa o la primera disponible)
            let facturacionData = null
            for (let i = 0; i <= 2; i++) {
                const activo = record[`Facturacion[${i}].activo`]
                if (activo === 'true' || activo === true || (!facturacionData && record[`Facturacion[${i}].tipo_documento`])) {
                    facturacionData = {
                        tipo_cliente: record[`Facturacion[${i}].tipo_cliente`],
                        tipo_documento: record[`Facturacion[${i}].tipo_documento`],
                        nif_documento: record[`Facturacion[${i}].nif_documento`],
                        razon_social: record[`Facturacion[${i}].razon_social`],
                        apellido1: record[`Facturacion[${i}].apellido1`],
                        apellido2: record[`Facturacion[${i}].apellido2`],
                        nombres: record[`Facturacion[${i}].nombres`],
                        calle: record[`Facturacion[${i}].dirrecion_calle`],
                        numero: record[`Facturacion[${i}].dirrecion_numero`],
                        piso: record[`Facturacion[${i}].dirrecion_piso`],
                        cp: record[`Facturacion[${i}].dirrecion_cp`],
                        localidad: record[`Facturacion[${i}].dirrecion_localidad`],
                        comunidad: record[`Facturacion[${i}].dirrecion_comunidad`],
                        pais: record[`Facturacion[${i}].dirrecion_pais`],
                    }
                    if (activo === 'true' || activo === true) break
                }
            }

            // Construir dirección completa
            let direccion = ''
            if (facturacionData) {
                const parts = [
                    facturacionData.calle,
                    facturacionData.numero ? `nº ${facturacionData.numero}` : null,
                    facturacionData.piso
                ].filter(Boolean)
                direccion = parts.join(', ')
            }

            // Construir apellidos
            let apellidos = ''
            if (facturacionData) {
                apellidos = [facturacionData.apellido1, facturacionData.apellido2].filter(Boolean).join(' ')
            }

            // Determinar NIF/NIE o CIF
            let nif_nie = null
            let cif = null
            if (facturacionData?.nif_documento) {
                const doc = facturacionData.nif_documento.trim().toUpperCase()
                // Si empieza con letra (excepto X, Y, Z que son NIE) y tiene 8 dígitos + letra = CIF
                if (/^[A-HJ-NP-SUVW]\d{7}[A-Z0-9]$/.test(doc)) {
                    cif = doc
                } else {
                    nif_nie = doc
                }
            }

            const clientData = {
                tipo_cliente: mapTipoCliente(facturacionData?.tipo_cliente),
                nombre: facturacionData?.nombres || nombre || 'Sin nombre',
                apellidos: apellidos || null,
                razon_social: facturacionData?.razon_social || null,
                nif_nie: nif_nie,
                cif: cif,
                email: email || null,
                telefono: telefono,
                direccion: direccion || null,
                cp: facturacionData?.cp || null,
                municipio: facturacionData?.localidad || null,
                provincia: facturacionData?.comunidad || null,
                preferencias_comunicacion: [],
                acepta_marketing: false,
                consentimiento_rgpd: false,
            }

            // Insertar cliente
            const { error: clientError } = await supabase
                .from('clients')
                .insert(clientData)

            if (clientError) {
                console.error(`Error insertando cliente ${nombre || telefono}:`, clientError.message)
                errors++
                continue
            }

            imported++

            // Mostrar progreso cada 100 registros
            if (imported % 100 === 0) {
                console.log(`Progreso: ${imported} clientes importados...`)
            }

        } catch (err) {
            console.error(`Error procesando registro:`, err.message)
            errors++
        }
    }

    return { imported, errors }
}

// Main
async function main() {
    const csvPath = process.argv[2] || 'C:\\Users\\Andrei\\Downloads\\midcar.clients.csv'

    console.log('=========================================')
    console.log('  IMPORTADOR DE CLIENTES MIDCAR')
    console.log('=========================================')
    console.log(`\nArchivo CSV: ${csvPath}`)

    try {
        // Leer CSV
        console.log('\nLeyendo archivo CSV...')
        const records = await readCSV(csvPath)
        console.log(`Encontrados ${records.length} registros en el CSV`)

        // Limpiar tabla
        await cleanTable()

        // Importar
        const { imported, errors } = await importClients(records)

        // Resumen
        console.log('\n=========================================')
        console.log('  RESUMEN DE IMPORTACION')
        console.log('=========================================')
        console.log(`Clientes importados: ${imported}`)
        console.log(`Errores: ${errors}`)
        console.log('=========================================\n')

    } catch (err) {
        console.error('Error fatal:', err)
        process.exit(1)
    }
}

main()
