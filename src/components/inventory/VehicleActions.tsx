"use client"

import { useState } from "react"
import type { Vehicle } from "@/types"
import { VehicleAdGenerator } from "@/components/inventory/VehicleAdGenerator"
import { WebLinkModal } from "@/components/inventory/WebLinkModal"
import { ShareModal } from "@/components/inventory/ShareModal"
import { useToast } from "@/components/ui/toast"

interface VehicleActionsProps {
    vehicle: Vehicle
}

export function VehicleActions({ vehicle }: VehicleActionsProps) {
    const { addToast } = useToast()
    const [showAdGenerator, setShowAdGenerator] = useState(false)
    const [showWebLink, setShowWebLink] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    const handleSaveWebLink = (url: string) => {
        addToast('Enlace web guardado correctamente', 'success')
    }

    const buttonClass = "flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors active:scale-95"

    return (
        <>
            <button
                onClick={() => setShowWebLink(true)}
                className={buttonClass}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>language</span>
                Vincular Web
            </button>

            <button
                onClick={() => setShowAdGenerator(true)}
                className={buttonClass}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                Generar Flyer
            </button>

            <button
                onClick={() => setShowShareModal(true)}
                className={buttonClass}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
                Compartir
            </button>

            <VehicleAdGenerator
                vehicle={vehicle}
                open={showAdGenerator}
                onClose={() => setShowAdGenerator(false)}
            />

            <WebLinkModal
                vehicle={vehicle}
                open={showWebLink}
                onClose={() => setShowWebLink(false)}
                onSave={handleSaveWebLink}
            />

            <ShareModal
                vehicle={vehicle}
                open={showShareModal}
                onClose={() => setShowShareModal(false)}
            />
        </>
    )
}