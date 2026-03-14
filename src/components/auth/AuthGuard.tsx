"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase"
import { Loader2, Car, AlertTriangle } from "lucide-react"

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // SECURITY: If Supabase is not configured, redirect to error page
        if (!isSupabaseConfigured) {
            router.push("/error/configuracion")
            return
        }

        if (!loading && !user) {
            router.push("/login")
        }
    }, [user, loading, router])

    // SECURITY: If auth service is not configured, show error and block access
    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 mb-4">
                        <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 mb-2">
                        Servicio no disponible
                    </h1>
                    <p className="text-slate-500">
                        El sistema no está disponible en este momento.
                        Contacta al administrador.
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 mb-4 animate-pulse">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Cargando...</span>
                    </div>
                </div>
            </div>
        )
    }

    // If loading is done and there's no user, block rendering entirely.
    // router.push('/login') is async so there's a brief window where children
    // could flash. Returning null prevents any protected content from showing.
    if (!user) {
        return null
    }

    return <>{children}</>
}
