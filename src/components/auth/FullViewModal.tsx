"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Shield, Lock, Unlock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"

interface FullViewModalProps {
    open: boolean
    onClose: () => void
}

export function FullViewModal({ open, onClose }: FullViewModalProps) {
    const { unlockFullView } = useAuth()
    const { addToast } = useToast()
    const [code, setCode] = useState("")
    const [showCode, setShowCode] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await unlockFullView(code)

            if (result.success) {
                addToast("Acceso concedido. Ahora ves la visión completa del concesionario.", "success")
                setCode("")
                onClose()
            } else {
                if (result.locked) {
                    setError(result.error || "Demasiados intentos. Espera 15 minutos.")
                } else if (result.remainingAttempts !== undefined && result.remainingAttempts <= 2) {
                    setError(`${result.error}. Te quedan ${result.remainingAttempts} intentos.`)
                } else {
                    setError(result.error || "Código incorrecto. Inténtalo de nuevo.")
                }
            }
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setCode("")
        setError("")
        onClose()
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            handleClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-sm glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-3 text-white/90">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="block">Visión Completa</span>
                            <span className="text-xs font-normal text-white/40">Acceso al dashboard global</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} autoComplete="off" data-form-type="other" className="p-6 space-y-5">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-white/70">
                            Introduce el código de acceso para ver los datos de todo el concesionario, incluyendo los de todos los trabajadores.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            Código de Acceso
                        </label>
                        <div className="relative">
                            <input
                                type={showCode ? "text" : "password"}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="XXXXXXXX"
                                required
                                autoFocus
                                name="view-access-pin"
                                autoComplete="one-time-code"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                data-form-type="other"
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-center tracking-[0.3em] font-mono placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCode(!showCode)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                            >
                                {showCode ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 bg-white/[0.03] border border-white/[0.08] text-white/60 font-medium rounded-xl hover:bg-white/[0.06] transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || code.length < 4}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <Unlock className="w-4 h-4" />
                            )}
                            Acceder
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
