// Script para insertar contratos de los PDFs
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvwxgzwremuijxinrvxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2d3hnendyZW11aWp4aW5ydnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDM1MjQsImV4cCI6MjA4MzI3OTUyNH0.MWF_dUmSWRXhtPpQUZFxpUiLTwMpuLl0hpm8YboI-ec'

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateContractNumber() {
    const year = new Date().getFullYear()

    const { data, error } = await supabase
        .from('contratos')
        .select('numero_contrato')
        .like('numero_contrato', `CV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error || !data || data.length === 0) {
        return `CV-${year}-0001`
    }

    const lastNumber = data[0].numero_contrato
    const match = lastNumber.match(/CV-\d{4}-(\d+)/)
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1

    return `CV-${year}-${String(nextNum).padStart(4, '0')}`
}

async function insertContracts() {
    console.log('Insertando contratos de los PDFs...\n')

    // Generar numeros de contrato
    const numero1 = await generateContractNumber()
    const numero2 = `CV-2026-${String(parseInt(numero1.split('-')[2]) + 1).padStart(4, '0')}`

    // Contrato 1: Peugeot 5008 GT Line (comprador sin datos)
    const contrato1 = {
        numero_contrato: numero1,
        empresa_nombre: 'MIDCAR AUTOMOCION S.L.',
        empresa_cif: 'B12345678',
        empresa_direccion: 'Calle Principal, 123, 28001 Madrid',
        vehiculo_marca: 'Peugeot',
        vehiculo_modelo: '5008 GT Line',
        vehiculo_km: 87000,
        vehiculo_precio: 29950.00,
        comprador_tipo: 'particular',
        comprador_nombre: '(Sin especificar)',
        comprador_documento_tipo: 'DNI',
        comprador_documento: '(Sin especificar)',
        precio_venta: 29950.00,
        forma_pago: 'Transferencia bancaria',
        garantia_meses: 12,
        garantia_km: 12000,
        garantia_tipo: 'Mecanica y electrica',
        estado: 'borrador',
        fecha_firma: '2026-01-25',
        notas: 'Contrato importado desde PDF. Datos del comprador pendientes de completar. Base imponible: 24.752,07 EUR, IVA (21%): 5.197,93 EUR'
    }

    // Contrato 2: BMW 530dA Luxury Line
    const contrato2 = {
        numero_contrato: numero2,
        empresa_nombre: 'MIDCAR AUTOMOCION S.L.',
        empresa_cif: 'B12345678',
        empresa_direccion: 'Calle Principal, 123, 28001 Madrid',
        vehiculo_marca: 'BMW',
        vehiculo_modelo: '530dA Luxury Line',
        vehiculo_km: 159000,
        vehiculo_precio: 31950.00,
        comprador_tipo: 'particular',
        comprador_nombre: 'qwgf',
        comprador_apellidos: 'qweg',
        comprador_documento_tipo: 'DNI',
        comprador_documento: 'qweg1253',
        comprador_telefono: '135',
        precio_venta: 31950.00,
        forma_pago: 'Transferencia bancaria',
        garantia_meses: 12,
        garantia_km: 12000,
        garantia_tipo: 'Mecanica y electrica',
        estado: 'firmado',
        fecha_firma: '2026-01-25',
        fecha_entrega: '2026-01-25',
        notas: 'Contrato importado desde PDF. Base imponible: 26.404,96 EUR, IVA (21%): 5.545,04 EUR'
    }

    // Insertar contrato 1
    console.log(`Insertando contrato ${numero1} (Peugeot 5008)...`)
    const { data: data1, error: error1 } = await supabase
        .from('contratos')
        .insert(contrato1)
        .select()
        .single()

    if (error1) {
        console.error('Error insertando contrato 1:', error1.message)
    } else {
        console.log('Contrato 1 insertado con ID:', data1.id)
    }

    // Insertar contrato 2
    console.log(`\nInsertando contrato ${numero2} (BMW 530dA)...`)
    const { data: data2, error: error2 } = await supabase
        .from('contratos')
        .insert(contrato2)
        .select()
        .single()

    if (error2) {
        console.error('Error insertando contrato 2:', error2.message)
    } else {
        console.log('Contrato 2 insertado con ID:', data2.id)
    }

    console.log('\n========================================')
    console.log('Resumen:')
    console.log('========================================')
    if (!error1) console.log(`- ${numero1}: Peugeot 5008 GT Line - 29.950 EUR`)
    if (!error2) console.log(`- ${numero2}: BMW 530dA Luxury Line - 31.950 EUR`)
    console.log('\nContratos insertados correctamente!')
}

insertContracts().catch(console.error)
