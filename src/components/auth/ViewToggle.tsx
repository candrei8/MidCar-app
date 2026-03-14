"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { User, Building2, Lock, ArrowLeft } from "lucide-react"
import { FullViewModal } from "./FullViewModal"
import { cn } from "@/lib/utils"

export function ViewToggle() {
    const { isFullView, lockFullView, user } = useAuth()
    const [showModal, setShowModal] = useState(false)

    // Si está en visión completa, siempre mostrar botón para volver
    // Si no, mostrar botón para acceder solo si hay usuario
    return (
        <>
            <div className="flex items-center gap-2">
                {isFullView ? (
                    <button
                        onClick={lockFullView}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                            "bg-indigo-100 border border-indigo-200",
                            "text-indigo-700 hover:bg-indigo-200"
                        )}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver a Mi Vista</span>
                        <Building2 className="w-4 h-4 sm:hidden" />
                    </button>
                ) : user ? (
                    <button
                        onClick={() => setShowModal(true)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                            "bg-slate-100 border border-slate-200",
                            "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                        )}
                    >
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Mi Vista</span>
                        <Lock className="w-3 h-3 text-slate-400" />
                    </button>
                ) : null}
            </div>

            <FullViewModal
                open={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    )
}
