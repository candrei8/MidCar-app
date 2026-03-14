// Root page - middleware handles the redirect based on auth state
// This is a fallback in case middleware doesn't catch it
import { redirect } from 'next/navigation'

export default function Home() {
    // Middleware will redirect to /login or /dashboard based on auth
    // This redirect is a fallback
    redirect('/login')
}
