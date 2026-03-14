/**
 * Script para importar vehículos desde CSV a Supabase
 *
 * Uso: node scripts/import-vehicles.mjs <ruta-al-csv>
 * Ejemplo: node scripts/import-vehicles.mjs "C:\Users\Andrei\Downloads\midcar.cars.csv"
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapeo de combustible
function mapCombustible(combustible) {
    if (!combustible) return 'diesel'
    const c = combustible.toLowerCase().trim()
    if (c.includes('gasolina')) return 'gasolina'
    if (c.includes('diesel') || c.includes('diésel')) return 'diesel'
    if (c.includes('hibrido') || c.includes('híbrido') || c.includes('glp')) return 'hibrido'
    if (c.includes('electric')) return 'electrico'
    if (c.includes('gnc')) return 'gnc'
    return 'diesel'
}

// Mapeo de transmisión
function mapTransmision(cambio) {
    if (!cambio) return 'manual'
    const c = cambio.toLowerCase().trim()
    if (c.includes('auto')) return 'automatico'
    if (c.includes('semi')) return 'semiautomatico'
    return 'manual'
}

// Mapeo de etiqueta DGT
function mapEtiquetaDGT(distintivo) {
    if (!distintivo) return 'SIN'
    const d = distintivo.toUpperCase().trim()
    if (d === '0' || d === 'CERO') return '0'
    if (d === 'ECO') return 'ECO'
    if (d === 'C') return 'C'
    if (d === 'B') return 'B'
    return 'SIN'
}

// Mapeo de estado
function mapEstado(estado, disponibilidad) {
    if (!estado) return 'disponible'
    const e = estado.toLowerCase().trim()
    const d = (disponibilidad || '').toLowerCase().trim()

    if (e.includes('vendido') || e.includes('entregado') || d.includes('entregado')) return 'vendido'
    if (e.includes('reserva')) return 'reservado'
    if (e.includes('taller')) return 'taller'
    if (e.includes('baja')) return 'baja'
    if (e.includes('disponible') || e.includes('venta')) return 'disponible'
    return 'disponible'
}

// Mapeo de tipo carrocería
function mapCarroceria(tipo) {
    if (!tipo) return 'Berlina'
    const t = tipo.toLowerCase().trim()
    if (t.includes('familiar') || t.includes('sw') || t.includes('sportbreak') || t.includes('touring')) return 'Familiar'
    if (t.includes('suv') || t.includes('todoterreno') || t.includes('4x4')) return 'SUV'
    if (t.includes('monovolumen') || t.includes('mpv')) return 'Monovolumen'
    if (t.includes('coupe') || t.includes('coupé')) return 'Coupé'
    if (t.includes('cabrio') || t.includes('descapotable')) return 'Cabrio'
    if (t.includes('pickup') || t.includes('pick-up')) return 'Pick-up'
    if (t.includes('furgon') || t.includes('comercial')) return 'Furgón'
    return tipo || 'Berlina'
}

// Generar stock_id único
function generateStockId(matricula, index) {
    if (matricula) {
        return `STK-${matricula.replace(/\s/g, '')}`
    }
    return `STK-${Date.now()}-${index}`
}

// Parsear fecha
function parseDate(dateStr) {
    if (!dateStr || dateStr === '0' || dateStr.includes('2000-01-01') || dateStr.includes('2000-01-03')) return null
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        return date.toISOString().split('T')[0]
    } catch {
        return null
    }
}

// Extraer año de fecha
function extractYear(dateStr) {
    if (!dateStr) return null
    try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        return date.getFullYear()
    } catch {
        return null
    }
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

// Limpiar tablas relacionadas y vehículos
async function cleanTable() {
    console.log('\n--- Limpiando tablas relacionadas y vehicles ---')

    // Limpiar contratos primero (FK a vehicles)
    const { error: contratosError } = await supabase.from('contratos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (contratosError) console.log('Nota al limpiar contratos:', contratosError.message)
    else console.log('- Tabla contratos limpiada')

    // Limpiar facturas (puede tener FK a vehicles)
    const { error: facturasError } = await supabase.from('facturas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (facturasError) console.log('Nota al limpiar facturas:', facturasError.message)
    else console.log('- Tabla facturas limpiada')

    // Limpiar sales (FK a vehicles)
    const { error: salesError } = await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (salesError) console.log('Nota al limpiar sales:', salesError.message)
    else console.log('- Tabla sales limpiada')

    // Limpiar leads (FK a vehicles)
    const { error: leadsError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (leadsError) console.log('Nota al limpiar leads:', leadsError.message)
    else console.log('- Tabla leads limpiada')

    // Limpiar polizas_seguro (FK a vehicles)
    const { error: polizasError } = await supabase.from('polizas_seguro').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (polizasError) console.log('Nota al limpiar polizas_seguro:', polizasError.message)
    else console.log('- Tabla polizas_seguro limpiada')

    // Finalmente limpiar vehicles
    const { error } = await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.log('Nota al limpiar vehicles:', error.message)
    else console.log('- Tabla vehicles limpiada')

    console.log('Tablas limpias.\n')
}

// Importar vehículos
async function importVehicles(records) {
    console.log(`\n--- Importando ${records.length} vehículos ---\n`)

    let imported = 0
    let errors = 0

    for (let i = 0; i < records.length; i++) {
        const record = records[i]
        try {
            const matricula = record.matricula?.trim() || ''
            const marca = record.marca?.trim() || ''
            const modelo = record.modelo?.trim() || ''

            // Saltar si no hay matrícula o marca
            if (!matricula || !marca) {
                console.log(`Saltando vehículo sin matrícula o marca: ${marca} ${modelo}`)
                continue
            }

            // Extraer equipamiento
            const equipamiento = []
            for (let j = 0; j <= 34; j++) {
                const equip = record[`equip_standard[${j}]`]?.trim()
                if (equip) equipamiento.push(equip)
            }
            for (let j = 0; j <= 36; j++) {
                const equip = record[`equip_extra[${j}]`]?.trim()
                if (equip && !equipamiento.includes(equip)) equipamiento.push(equip)
            }

            const vehicleData = {
                vin: record.bastidor?.trim() || null,
                matricula: matricula,
                stock_id: generateStockId(matricula, i),

                // Estado
                estado: mapEstado(record.estado, record.disponibilidad_vehiculo),
                destacado: false,
                en_oferta: false,

                // Info básica
                marca: marca,
                modelo: modelo,
                version: record.serie?.trim() || null,
                año_fabricacion: extractYear(record.fecha_matriculacion),
                año_matriculacion: extractYear(record.fecha_matriculacion),

                // Técnico
                tipo_motor: record.motor?.trim() || null,
                cilindrada: parseInt(record.cilindrada) || null,
                potencia_cv: parseInt(record.potencia_cv) || parseInt(record.potencia) || null,
                potencia_kw: parseInt(record.potencia_kw) || null,
                combustible: mapCombustible(record.combustible),
                consumo_mixto: parseFloat(record.consumo_medio) || null,
                emisiones_co2: null,
                etiqueta_dgt: mapEtiquetaDGT(record.distintivo_ambiental),
                transmision: mapTransmision(record.cambio),
                num_marchas: parseInt(record.marchas) || null,
                traccion: record.traccion?.trim() || null,

                // Carrocería
                tipo_carroceria: mapCarroceria(record.caroceria),
                num_puertas: parseInt(record.puertas) || null,
                num_plazas: parseInt(record.plazas) || null,
                color_exterior: record.color?.trim() || null,
                color_interior: null,

                // Historial
                kilometraje: parseInt(record.km_salida) || parseInt(record.km_entrada) || 0,
                num_propietarios: parseInt(record.proprietarios) || 1,
                es_nacional: true,
                primera_mano: parseInt(record.proprietarios) === 1,

                // Comercial
                precio_compra: parseFloat(record.precio_compra) || 0,
                gastos_compra: 0,
                coste_reparaciones: 0,
                precio_venta: parseFloat(record.precio_contado) || parseFloat(record.precio_financiacion) || 0,
                descuento: 0,
                fecha_entrada_stock: parseDate(record.fecha_compra) || new Date().toISOString().split('T')[0],

                // Garantía
                garantia_meses: record.garantia_venta?.toLowerCase().includes('plus') ? 12 : 6,
                tipo_garantia: record.garantia_venta || 'Básica',

                // Imágenes
                imagen_principal: null,

                // Web
                url_web: record.webpage || null,
                datos_sincronizados: !!record.webpage,
                ultima_sincronizacion: record.webpage ? new Date().toISOString() : null,

                // Equipamiento
                equipamiento: equipamiento,
            }

            // Insertar vehículo
            const { error: vehicleError } = await supabase
                .from('vehicles')
                .insert(vehicleData)

            if (vehicleError) {
                console.error(`Error insertando vehículo ${matricula}:`, vehicleError.message)
                errors++
                continue
            }

            imported++

            // Mostrar progreso cada 50 registros
            if (imported % 50 === 0) {
                console.log(`Progreso: ${imported} vehículos importados...`)
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
    const csvPath = process.argv[2] || 'C:\\Users\\Andrei\\Downloads\\midcar.cars.csv'

    console.log('=========================================')
    console.log('  IMPORTADOR DE VEHICULOS MIDCAR')
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
        const { imported, errors } = await importVehicles(records)

        // Resumen
        console.log('\n=========================================')
        console.log('  RESUMEN DE IMPORTACION')
        console.log('=========================================')
        console.log(`Vehículos importados: ${imported}`)
        console.log(`Errores: ${errors}`)
        console.log('=========================================\n')

    } catch (err) {
        console.error('Error fatal:', err)
        process.exit(1)
    }
}

main()
