/**
 * Script para importar contactos desde CSV a Supabase
 *
 * Uso: node scripts/import-contacts.mjs <ruta-al-csv>
 * Ejemplo: node scripts/import-contacts.mjs "C:\Users\Andrei\Downloads\midcar.contacts.csv"
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de canal de contacto a origen
function mapOrigen(canal) {
    if (!canal) return 'otro'
    const c = canal.toLowerCase().trim()
    if (c.includes('coches.net') || c.includes('cocches.net')) return 'coches_net'
    if (c.includes('coches.com')) return 'coches_net'
    if (c === 'web') return 'web'
    if (c === 'carfactory') return 'otro'
    if (c.includes('whatsapp')) return 'whatsapp'
    if (c.includes('facebook')) return 'facebook'
    if (c.includes('instagram')) return 'instagram'
    if (c.includes('wallapop')) return 'wallapop'
    return 'otro'
}

// Mapeo de estado
function mapEstado(estado) {
    if (!estado) return 'pendiente'
    const e = estado.toLowerCase().trim()
    if (e === 'pendiente') return 'pendiente'
    if (e === 'cerrado') return 'cerrado'
    if (e === 'comunicado') return 'comunicado'
    if (e === 'tramite') return 'tramite'
    if (e === 'reservado') return 'reservado'
    if (e === 'postventa') return 'postventa'
    if (e === 'busqueda') return 'busqueda'
    return 'pendiente'
}

// Mapeo de tipo de pago
function mapTipoPago(tipo) {
    if (!tipo) return null
    const t = tipo.toLowerCase().trim()
    if (t.includes('financ')) return 'financiacion'
    if (t.includes('contado')) return 'contado'
    if (t.includes('renting')) return 'renting'
    return null
}

// Mapeo de categoria
function mapCategoria(categoria) {
    if (!categoria) return null
    const c = categoria.toLowerCase().trim()
    if (c === 'vehiculo') return 'vehiculo'
    if (c === 'financiacion') return 'financiacion'
    if (c === 'postventa') return 'postventa'
    if (c === 'tasacion') return 'tasacion'
    return 'otro'
}

// Mapeo de tipo de interaccion
function mapTipoInteraccion(canal, medio) {
    const c = (canal || '').toLowerCase()
    const m = (medio || '').toLowerCase()

    if (c.includes('whatsapp') || m.includes('whatsapp')) return 'whatsapp'
    if (c.includes('email') || m.includes('email')) return 'email_enviado'
    if (c.includes('telefono') || m.includes('llamada')) return 'llamada_saliente'
    if (c.includes('visita') || m.includes('visita')) return 'visita'
    return 'nota'
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

// Limpiar tablas existentes
async function cleanTables() {
    console.log('\n--- Limpiando tablas existentes ---')

    // Limpiar interacciones primero (FK)
    const { error: intError } = await supabase.from('interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (intError) console.log('Nota al limpiar interactions:', intError.message)
    else console.log('- Tabla interactions limpiada')

    // Limpiar contactos
    const { error: contError } = await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (contError) console.log('Nota al limpiar contacts:', contError.message)
    else console.log('- Tabla contacts limpiada')

    console.log('Tablas limpias.\n')
}

// Importar contactos
async function importContacts(records) {
    console.log(`\n--- Importando ${records.length} contactos ---\n`)

    let imported = 0
    let errors = 0
    let interactionsImported = 0

    for (const record of records) {
        try {
            // Preparar datos del contacto
            const telefono = record.telefono_contacto?.trim() || ''
            const email = record.email_contacto?.trim() || ''

            // Saltar si no hay telefono ni email
            if (!telefono && !email) {
                console.log(`Saltando contacto sin telefono ni email: ${record.cliente_nombre || 'Sin nombre'}`)
                continue
            }

            const contactData = {
                telefono: telefono || 'Sin telefono',
                email: email || null,
                nombre: record.cliente_nombre?.trim() || null,
                origen: mapOrigen(record.canal_contacto),
                estado: mapEstado(record.estado),
                tipo_pago: mapTipoPago(record.tipo_pago),
                categoria: mapCategoria(record.contacto_categoria),
                asunto: record.coche_titulo?.trim() || record.contacto_asunto?.trim() || null,
                progreso: parseInt(record.contacto_interes) || 0,
                precio: parseFloat(record.precio_venta) || null,
                reserva: parseFloat(record.cantidad_reserva) || null,
                transporte: parseFloat(record.cantidad_transporte) || null,
                notas: null,
                fecha_registro: record.fecha_contacto ? new Date(record.fecha_contacto).toISOString() : new Date().toISOString(),
                fecha_ultimo_contacto: record.fecha_ultimo_contacto ? new Date(record.fecha_ultimo_contacto).toISOString() : null,
                ultima_interaccion: record.fecha_ultimo_contacto ? new Date(record.fecha_ultimo_contacto).toISOString() : null,
                preferencias_comunicacion: [],
                acepta_marketing: false,
                consentimiento_rgpd: false,
                es_nuevo_cliente: true,
            }

            // Insertar contacto
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .insert(contactData)
                .select()
                .single()

            if (contactError) {
                console.error(`Error insertando contacto ${record.cliente_nombre}:`, contactError.message)
                errors++
                continue
            }

            imported++

            // Importar historial de interacciones
            const interactions = []
            for (let i = 0; i <= 14; i++) {
                const fecha = record[`istorial[${i}].fecha`]
                const mensaje = record[`istorial[${i}].mensaje`]
                const asunto = record[`istorial[${i}].asunto`]
                const usuario = record[`istorial[${i}].usuario`]
                const canal = record[`istorial[${i}].canal_comunicacion`]
                const medio = record[`istorial[${i}].medio_comunicacion`]

                if (fecha && (mensaje || asunto)) {
                    interactions.push({
                        contact_id: contact.id,
                        tipo: mapTipoInteraccion(canal, medio),
                        fecha: new Date(fecha).toISOString().split('T')[0],
                        hora: new Date(fecha).toISOString().split('T')[1]?.substring(0, 8) || '12:00:00',
                        descripcion: mensaje || asunto || 'Sin descripcion',
                        resultado: asunto || null,
                    })
                }
            }

            // Insertar interacciones en lotes
            if (interactions.length > 0) {
                const { error: intError } = await supabase
                    .from('interactions')
                    .insert(interactions)

                if (intError) {
                    console.error(`Error insertando interacciones para ${record.cliente_nombre}:`, intError.message)
                } else {
                    interactionsImported += interactions.length
                }
            }

            // Mostrar progreso cada 50 registros
            if (imported % 50 === 0) {
                console.log(`Progreso: ${imported} contactos importados...`)
            }

        } catch (err) {
            console.error(`Error procesando registro:`, err.message)
            errors++
        }
    }

    return { imported, errors, interactionsImported }
}

// Main
async function main() {
    const csvPath = process.argv[2] || 'C:\\Users\\Andrei\\Downloads\\midcar.contacts.csv'

    console.log('=========================================')
    console.log('  IMPORTADOR DE CONTACTOS MIDCAR')
    console.log('=========================================')
    console.log(`\nArchivo CSV: ${csvPath}`)

    try {
        // Leer CSV
        console.log('\nLeyendo archivo CSV...')
        const records = await readCSV(csvPath)
        console.log(`Encontrados ${records.length} registros en el CSV`)

        // Limpiar tablas
        await cleanTables()

        // Importar
        const { imported, errors, interactionsImported } = await importContacts(records)

        // Resumen
        console.log('\n=========================================')
        console.log('  RESUMEN DE IMPORTACION')
        console.log('=========================================')
        console.log(`Contactos importados: ${imported}`)
        console.log(`Interacciones importadas: ${interactionsImported}`)
        console.log(`Errores: ${errors}`)
        console.log('=========================================\n')

    } catch (err) {
        console.error('Error fatal:', err)
        process.exit(1)
    }
}

main()
