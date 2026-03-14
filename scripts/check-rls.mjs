// Test if we can read contacts WITHOUT authentication
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

// Check current session
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED (anonymous)')

// Try to read contacts without auth
const { count, error } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

if (error) {
    console.log('❌ Cannot read contacts:', error.message, error.code)
    console.log('→ This is the RLS issue! Supabase blocks unauthenticated reads.')
} else {
    console.log('✅ Can read contacts anonymously:', count, 'rows')
}

// Also check the RLS policies
const { data: policies, error: pErr } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'contacts')

if (pErr) {
    console.log('Cannot check policies:', pErr.message)
} else {
    console.log('Policies:', JSON.stringify(policies, null, 2))
}
