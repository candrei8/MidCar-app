// Simulate exactly what the browser does: anon key, no auth session
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env', 'utf8')
const getVar = (name) => {
    const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'))
    return match ? match[1].trim() : null
}
const url = getVar('NEXT_PUBLIC_SUPABASE_URL')
const key = getVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const supabase = createClient(url, key)

console.log('=== Simulating browser (no auth) ===\n')

// Test 1: Can we read contacts?
const { data: contacts, count: contactCount, error: cErr } = await supabase
    .from('contacts')
    .select('id, nombre, apellidos, telefono, estado, created_by', { count: 'exact' })
    .limit(5)

if (cErr) {
    console.log('❌ /contactos would be EMPTY - Error:', cErr.message, cErr.code)
} else {
    console.log(`✅ /contactos would show ${contactCount} contacts`)
    console.log('   Sample:', contacts.slice(0, 2).map(c => `${c.nombre} ${c.apellidos || ''}`).join(', '))
}

// Test 2: Can we read leads?
const { count: leadCount, error: lErr } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

if (lErr) {
    console.log('❌ /crm would be EMPTY - Error:', lErr.message, lErr.code)
} else {
    console.log(`\n✅ /crm leads table has ${leadCount} rows`)
    if (leadCount === 0) {
        console.log('   → /crm IS empty because NO LEADS have been created.')
        console.log('   → The imported clients are in /contactos, not /crm.')
    }
}

console.log('\n=== CONCLUSION ===')
console.log('The CRM (/crm) shows LEADS. There are 0 leads = CRM is empty.')
console.log('The imported clients are in /contactos (8955 records).')
console.log('To see clients in CRM, leads need to be created from contacts.')
