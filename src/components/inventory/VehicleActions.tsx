"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Globe, Share } from "lucide-react"
import type { Vehicle } from "@/types"
import { VehicleAdGenerator } from "@/components/inventory/VehicleAdGenerator"
import { WebLinkModal } from "@/components/inventory/WebLinkModal"
import { ShareModal } from "@/components/inventory/ShareModal"

interface VehicleActionsProps {
    vehicle: Vehicle
}

export function VehicleActions({ vehicle }: VehicleActionsProps) {
    const [showAdGenerator, setShowAdGenerator] = useState(false)
    const [showWebLink, setShowWebLink] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    const handleSaveWebLink = (url: string) => {
        // In a real app, this would save to the database
        console.log('Web URL saved:', url)
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebLink(true)}
                className="gap-2"
            >
                <Globe className="h-4 w-4" />
                Vincular Web
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdGenerator(true)}
                className="gap-2"
            >
                <QrCode className="h-4 w-4" />
                Generar Anuncio
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowShareModal(true)}
                className="gap-2"
            >
                <Share className="h-4 w-4" />
                Compartir
            </Button>

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