"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Link as LinkIcon,
    ExternalLink,
    AlertTriangle,
    Check,
    X,
    RefreshCw,
    Image as ImageIcon,
    Globe,
} from "lucide-react"
import type { Vehicle } from "@/types"

interface WebLinkModalProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
    onSave: (url: string) => void
}

interface MissingData {
    field: string
    label: string
}

export function WebLinkModal({ vehicle, open, onClose, onSave }: WebLinkModalProps) {
    const [webUrl, setWebUrl] = useState(vehicle.url_web || "")
    const [isLoading, setIsLoading] = useState(false)
    const [importedImage, setImportedImage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Check for missing data
    const checkMissingData = (): MissingData[] => {
        const missing: MissingData[] = []

        if (!vehicle.marca) missing.push({ field: 'marca', label: 'Marca' })
        if (!vehicle.modelo) missing.push({ field: 'modelo', label: 'Modelo' })
        if (!vehicle.version) missing.push({ field: 'version', label: 'Versión' })
        if (!vehicle.año_matriculacion) missing.push({ field: 'año_matriculacion', label: 'Año matriculación' })
        if (!vehicle.kilometraje) missing.push({ field: 'kilometraje', label: 'Kilómetros' })
        if (!vehicle.combustible) missing.push({ field: 'combustible', label: 'Combustible' })
        if (!vehicle.transmision) missing.push({ field: 'transmision', label: 'Transmisión' })
        if (!vehicle.precio_venta) missing.push({ field: 'precio_venta', label: 'Precio de venta' })
        if (!vehicle.imagen_principal) missing.push({ field: 'imagen_principal', label: 'Imagen principal' })
        if (!vehicle.potencia_cv) missing.push({ field: 'potencia_cv', label: 'Potencia (CV)' })
        if (!vehicle.color_exterior) missing.push({ field: 'color_exterior', label: 'Color exterior' })
        if (!vehicle.etiqueta_dgt || vehicle.etiqueta_dgt === 'SIN') missing.push({ field: 'etiqueta_dgt', label: 'Etiqueta DGT' })

        return missing
    }

    const missingData = checkMissingData()

    const handleImportImage = async () => {
        if (!webUrl) {
            setError('Introduce una URL válida')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // In a real implementation, this would call an API endpoint that scrapes the web page
            // For now, we'll simulate the process
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Simulate finding an image
            // In real implementation: fetch the URL, parse HTML, find og:image or main vehicle image
            setImportedImage(vehicle.imagen_principal) // Use existing image as placeholder

        } catch (err) {
            setError('No se pudo importar la imagen. Verifica la URL.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = () => {
        if (webUrl) {
            onSave(webUrl)
        }
        onClose()
    }

    const isValidUrl = (url: string) => {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Vincular con Web
                    </DialogTitle>
                    <DialogDescription>
                        Conecta este vehículo con su ficha en la web del concesionario
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="webUrl">URL del vehículo en la web</Label>
                        <div className="flex gap-2">
                            <Input
                                id="webUrl"
                                placeholder="https://midcar.es/vehiculos/..."
                                value={webUrl}
                                onChange={(e) => {
                                    setWebUrl(e.target.value)
                                    setError(null)
                                }}
                            />
                            {webUrl && isValidUrl(webUrl) && (
                                <Button variant="outline" size="icon" asChild>
                                    <a href={webUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>

                    {/* Import Image */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Importar imagen principal</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImportImage}
                                disabled={!webUrl || isLoading}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ImageIcon className="h-4 w-4" />
                                )}
                                {isLoading ? 'Importando...' : 'Importar'}
                            </Button>
                        </div>

                        {importedImage && (
                            <div className="relative">
                                <div
                                    className="h-40 rounded-lg bg-cover bg-center"
                                    style={{ backgroundImage: `url(${importedImage})` }}
                                />
                                <Badge className="absolute top-2 right-2 bg-success">
                                    <Check className="h-3 w-3 mr-1" />
                                    Importada
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Missing Data Warning */}
                    {missingData.length > 0 && (
                        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-warning-foreground mb-2">
                                        Datos faltantes ({missingData.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {missingData.map((item) => (
                                            <Badge key={item.field} variant="outline" className="text-xs">
                                                <X className="h-3 w-3 mr-1 text-danger" />
                                                {item.label}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Completa estos datos para una publicación web óptima
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All data complete */}
                    {missingData.length === 0 && (
                        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-success" />
                                <div>
                                    <p className="font-medium text-success">
                                        Datos completos
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        El vehículo tiene toda la información necesaria para la web
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Summary */}
                    <div className="p-4 bg-surface-100 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div
                                className="h-16 w-24 rounded bg-cover bg-center flex-shrink-0"
                                style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
                            />
                            <div>
                                <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                                <p className="text-sm text-muted-foreground">{vehicle.version}</p>
                                <p className="text-sm font-mono text-muted-foreground">{vehicle.matricula}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Guardar enlace
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
