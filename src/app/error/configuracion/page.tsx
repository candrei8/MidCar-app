"use client"

import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ConfigurationErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <AlertTriangle className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Servicio no disponible
                    </h1>

                    {/* Description */}
                    <p className="text-slate-300 text-center mb-6">
                        El sistema no está disponible en este momento.
                        Por favor, contacta al administrador.
                    </p>

                    {/* Error code */}
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Código de error</p>
                        <p className="text-slate-400 font-mono">ERR_SERVICE_UNAVAILABLE</p>
                    </div>

                    {/* Back to login */}
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver al inicio</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
