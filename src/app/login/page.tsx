"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase"
import { Eye, EyeOff, LogIn, Car, Loader2, AlertTriangle } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const { signIn } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // SECURITY: Check if authentication system is configured
    const authDisabled = !isSupabaseConfigured

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // SECURITY: Prevent login attempts if auth is disabled
        if (authDisabled) {
            setError("El servicio no está disponible en este momento.")
            return
        }

        setError("")
        setLoading(true)

        try {
            const { error: signInError } = await signIn(email, password)

            if (signInError) {
                setError("Credenciales incorrectas. Por favor, verifica tu email y contraseña.")
            } else {
                router.push("/dashboard")
            }
        } catch {
            setError("Error al iniciar sesión. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px]" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Login card */}
            <div className="relative w-full max-w-md">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 mb-4">
                        <Car className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#ffffff' }}>MidCar</h1>
                    <p className="text-white/40 text-sm mt-1">Sistema de Gestión de Concesionario</p>
                </div>

                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-white/90">Iniciar Sesión</h2>
                        <p className="text-white/40 text-sm mt-1">Accede a tu panel personal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        {/* SECURITY: Warning when auth is disabled */}
                        {authDisabled && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-amber-400 text-sm font-medium">Servicio no disponible</p>
                                        <p className="text-amber-400/70 text-xs mt-1">
                                            El sistema no está disponible en este momento.
                                            Contacta al administrador.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                autoComplete="off"
                                data-form-type="other"
                                className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="off"
                                    data-form-type="other"
                                    className="w-full px-4 py-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading || authDisabled}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Iniciar Sesión
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-white/[0.06]">
                        <p className="text-center text-white/50 text-sm">
                            ¿No tienes cuenta?{" "}
                            <a href="/registro" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                Regístrate aquí
                            </a>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
