"use client"

import { useState, useRef } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Printer,
    Download,
    Eye,
    Settings,
} from "lucide-react"
import type { Vehicle } from "@/types"
import { PrintableAd } from "./PrintableAd"

interface VehicleAdGeneratorProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
}

export function VehicleAdGenerator({ vehicle, open, onClose }: VehicleAdGeneratorProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [showFinancing, setShowFinancing] = useState(true)
    const [customUrl, setCustomUrl] = useState("")
    const [companyInfo, setCompanyInfo] = useState({
        name: "MidCar",
        phone: "91 123 45 67",
        address: "C/ Principal 123, Madrid"
    })

    const handlePrint = () => {
        const printContent = printRef.current
        if (!printContent) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Anuncio - ${vehicle.marca} ${vehicle.modelo}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    .printable-ad {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 10mm;
                        background: white;
                    }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .text-gray-800 { color: #1f2937; }
                    .text-gray-600 { color: #4b5563; }
                    .text-gray-500 { color: #6b7280; }
                    .text-gray-400 { color: #9ca3af; }
                    .text-red-600 { color: #dc2626; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .bg-gray-100 { background-color: #f3f4f6; }
                    .rounded-lg { border-radius: 0.5rem; }
                    .rounded-xl { border-radius: 0.75rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .mb-6 { margin-bottom: 1.5rem; }
                    .mt-1 { margin-top: 0.25rem; }
                    .mt-2 { margin-top: 0.5rem; }
                    .mt-4 { margin-top: 1rem; }
                    .p-3 { padding: 0.75rem; }
                    .p-8 { padding: 2rem; }
                    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
                    .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
                    .pt-6 { padding-top: 1.5rem; }
                    .pb-4 { padding-bottom: 1rem; }
                    .border-b-2 { border-bottom: 2px solid #e5e7eb; }
                    .border-t-2 { border-top: 2px solid #e5e7eb; }
                    .border-y { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
                    .border-t { border-top: 1px solid #e5e7eb; }
                    .grid { display: grid; }
                    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
                    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                    .gap-4 { gap: 1rem; }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .justify-between { justify-content: space-between; }
                    .flex-col { flex-direction: column; }
                    .uppercase { text-transform: uppercase; }
                    .capitalize { text-transform: capitalize; }
                    .line-through { text-decoration: line-through; }
                    .text-xs { font-size: 0.75rem; }
                    .text-sm { font-size: 0.875rem; }
                    .text-lg { font-size: 1.125rem; }
                    .text-xl { font-size: 1.25rem; }
                    .text-2xl { font-size: 1.5rem; }
                    .text-3xl { font-size: 1.875rem; }
                    .text-4xl { font-size: 2.25rem; }
                    .text-6xl { font-size: 3.75rem; }
                    .vehicle-image {
                        width: 100%;
                        height: 200mm;
                        background-size: cover;
                        background-position: center;
                        border-radius: 0.5rem;
                        margin-bottom: 1.5rem;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `)

        printWindow.document.close()
        printWindow.focus()

        // Wait for images to load
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-primary" />
                        Generar Anuncio Imprimible
                    </DialogTitle>
                    <DialogDescription>
                        Genera un anuncio A4 para {vehicle.marca} {vehicle.modelo}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="preview" className="flex-1">
                    <div className="px-6">
                        <TabsList>
                            <TabsTrigger value="preview" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Vista previa
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2">
                                <Settings className="h-4 w-4" />
                                Personalizar
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="preview" className="mt-0">
                        <div className="p-6 overflow-auto max-h-[calc(95vh-200px)] bg-gray-100">
                            <div
                                ref={printRef}
                                className="shadow-xl mx-auto"
                                style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}
                            >
                                <PrintableAd
                                    vehicle={vehicle}
                                    webUrl={customUrl || undefined}
                                    showFinancing={showFinancing}
                                    companyInfo={companyInfo}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
                        <div className="p-6 space-y-6 max-h-[calc(95vh-200px)] overflow-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-medium">Información de la empresa</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Nombre</Label>
                                        <Input
                                            id="companyName"
                                            value={companyInfo.name}
                                            onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyPhone">Teléfono</Label>
                                        <Input
                                            id="companyPhone"
                                            value={companyInfo.phone}
                                            onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyAddress">Dirección</Label>
                                        <Input
                                            id="companyAddress"
                                            value={companyInfo.address}
                                            onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-medium">Opciones del anuncio</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="customUrl">URL personalizada (QR)</Label>
                                        <Input
                                            id="customUrl"
                                            placeholder="https://midcar.es/vehiculos/..."
                                            value={customUrl}
                                            onChange={(e) => setCustomUrl(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Deja vacío para usar URL por defecto con matrícula
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="showFinancing"
                                            checked={showFinancing}
                                            onCheckedChange={(c) => setShowFinancing(c as boolean)}
                                        />
                                        <Label htmlFor="showFinancing">
                                            Mostrar información de financiación
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
