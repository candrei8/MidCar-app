"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Mail, MessageCircle, Send, FileText, Check } from "lucide-react"
import { useState } from "react"
import { Vehicle } from "@/types"

interface ShareModalProps {
    vehicle: Vehicle
    open: boolean
    onClose: () => void
}

export function ShareModal({ vehicle, open, onClose }: ShareModalProps) {
    const [copied, setCopied] = useState(false)
    const url = typeof window !== 'undefined' ? `${window.location.origin}/inventario/${vehicle.id}` : ''

    const handleCopy = () => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareData = {
        title: `MidCar - ${vehicle.marca} ${vehicle.modelo}`,
        text: `Mira este ${vehicle.marca} ${vehicle.modelo} ${vehicle.version} por ${vehicle.precio_venta}€`,
        url: url
    }

    const handleShare = (platform: 'email' | 'whatsapp' | 'telegram') => {
        let shareUrl = ''
        switch (platform) {
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + '\n\n' + shareData.url)}`
                break
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`
                break
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`
                break
        }
        window.open(shareUrl, '_blank')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartir Vehículo</DialogTitle>
                    <DialogDescription>
                        Comparte la ficha de este vehículo con tus clientes
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare('email')}> 
                            <Mail className="h-6 w-6" />
                            <span className="text-xs">Email</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare('whatsapp')}> 
                            <MessageCircle className="h-6 w-6" />
                            <span className="text-xs">WhatsApp</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={() => handleShare('telegram')}> 
                            <Send className="h-6 w-6" />
                            <span className="text-xs">Telegram</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={handleCopy}>
                            {copied ? <Check className="h-6 w-6 text-success" /> : <Copy className="h-6 w-6" />}
                            <span className="text-xs">Copiar</span>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Enlace directo</Label>
                        <div className="flex gap-2">
                            <Input value={url} readOnly />
                            <Button size="icon" variant="outline" onClick={handleCopy}>
                                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <Label>Generar PDF de ficha</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="fotos" defaultChecked />
                                <Label htmlFor="fotos">Incluir fotos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="precio" defaultChecked />
                                <Label htmlFor="precio">Incluir precio</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="tecnico" defaultChecked />
                                <Label htmlFor="tecnico">Datos técnicos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="contacto" defaultChecked />
                                <Label htmlFor="contacto">Datos contacto</Label>
                            </div>
                        </div>
                        <Button className="w-full gap-2">
                            <FileText className="h-4 w-4" />
                            Descargar Ficha PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
