"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Phone,
    Mail,
    MessageCircle,
    Car,
    Calendar,
    User,
    MessageSquare,
    FileText,
    SmilePlus,
    Meh,
    Frown,
    Clock,
    DollarSign
} from "lucide-react"
import type { Lead } from "@/types"
import { formatRelativeTime, formatCurrency, formatDate, cn } from "@/lib/utils"
import { ESTADOS_LEAD, PRIORIDADES_LEAD } from "@/lib/constants"

interface LeadDetailModalProps {
    lead: Lead
    open: boolean
    onClose: () => void
}

export function LeadDetailModal({ lead, open, onClose }: LeadDetailModalProps) {
    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positivo': return <SmilePlus className="h-4 w-4 text-success" />
            case 'negativo': return <Frown className="h-4 w-4 text-danger" />
            default: return <Meh className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl">
                                {lead.cliente?.nombre} {lead.cliente?.apellidos}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={lead.estado as 'nuevo' | 'contactado'}>
                                    {ESTADOS_LEAD.find(e => e.value === lead.estado)?.label}
                                </Badge>
                                <Badge variant={lead.prioridad as 'alta' | 'media' | 'baja'}>
                                    Prioridad: {lead.prioridad}
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {getSentimentIcon(lead.sentimiento_ia)}
                                    <span className="capitalize">{lead.sentimiento_ia}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4 mr-1" />
                                Llamar
                            </Button>
                            <Button variant="outline" size="sm">
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                            </Button>
                            <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                WhatsApp
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex-1">
                    <div className="px-6">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="info" className="gap-2">
                                <User className="h-4 w-4" />
                                Información
                            </TabsTrigger>
                            <TabsTrigger value="transcript" className="gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversación
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Actividad
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Notas
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="h-[calc(90vh-220px)]">
                        <div className="p-6">
                            {/* Info Tab */}
                            <TabsContent value="info" className="mt-0 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Cliente Info */}
                                    <Card className="card-premium">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Información del Cliente
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Nombre</span>
                                                <span className="font-medium">{lead.cliente?.nombre} {lead.cliente?.apellidos}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Email</span>
                                                <span className="font-medium">{lead.cliente?.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Teléfono</span>
                                                <span className="font-medium">{lead.cliente?.telefono}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Origen</span>
                                                <span className="font-medium">{lead.cliente?.origen_lead}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Registro</span>
                                                <span className="font-medium">{formatDate(lead.fecha_creacion)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Vehicle of Interest */}
                                    {lead.vehiculo && (
                                        <Card className="card-premium">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <Car className="h-4 w-4" />
                                                    Vehículo de Interés
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex gap-4">
                                                    <div
                                                        className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                                                        style={{ backgroundImage: `url(${lead.vehiculo.imagen_principal})` }}
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <h4 className="font-semibold">
                                                            {lead.vehiculo.marca} {lead.vehiculo.modelo}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {lead.vehiculo.version}
                                                        </p>
                                                        <p className="text-xl font-bold text-primary">
                                                            {formatCurrency(lead.vehiculo.precio_venta)}
                                                        </p>
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            <span>{lead.vehiculo.año_matriculacion}</span>
                                                            <span>•</span>
                                                            <span>{lead.vehiculo.kilometraje.toLocaleString()} km</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{lead.vehiculo.combustible}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Lead Details */}
                                <Card className="card-premium">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Detalles del Lead
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <span className="text-sm text-muted-foreground block">Estado</span>
                                                <Select defaultValue={lead.estado}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ESTADOS_LEAD.map(e => (
                                                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground block">Prioridad</span>
                                                <Select defaultValue={lead.prioridad}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PRIORIDADES_LEAD.map(p => (
                                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground block">Presupuesto</span>
                                                <p className="font-semibold mt-1">
                                                    {lead.presupuesto_cliente ? formatCurrency(lead.presupuesto_cliente) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-muted-foreground block">Forma de pago</span>
                                                <p className="font-semibold mt-1">{lead.forma_pago || '-'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Next Action */}
                                {lead.proxima_accion && (
                                    <Card className="card-premium border-primary/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Próxima acción: {lead.proxima_accion}</p>
                                                    {lead.fecha_proxima_accion && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatRelativeTime(lead.fecha_proxima_accion)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Transcript Tab */}
                                                <TabsContent value="transcript" className="mt-0">
                                                    <Card className="card-premium">
                                                        <CardHeader>
                                                            <CardTitle className="text-sm font-medium text-muted-foreground">Historial de Conversación</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                        {lead.transcript_chatbot && lead.transcript_chatbot.length > 0 ? (
                                            <div className="space-y-4">
                                                {lead.transcript_chatbot.map((message, index) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "flex gap-3",
                                                            message.role === 'user' ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        {message.role === 'assistant' && (
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="bg-primary text-white text-xs">
                                                                    MC
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        <div
                                                            className={cn(
                                                                "max-w-[70%] rounded-lg p-3",
                                                                message.role === 'user'
                                                                    ? "bg-primary text-white"
                                                                    : "bg-surface-200"
                                                            )}
                                                        >
                                                            <p className="text-sm">{message.content}</p>
                                                            <p className={cn(
                                                                "text-xs mt-1",
                                                                message.role === 'user' ? "text-white/70" : "text-muted-foreground"
                                                            )}>
                                                                {formatRelativeTime(message.timestamp)}
                                                            </p>
                                                        </div>
                                                        {message.role === 'user' && (
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs">
                                                                    {lead.cliente?.nombre.charAt(0)}{lead.cliente?.apellidos.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>No hay conversación del chatbot</p>
                                                <p className="text-sm">Este lead fue capturado por otro canal</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Activity Tab */}
                            <TabsContent value="activity" className="mt-0">
                                <Card className="card-premium">
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                                <div>
                                                    <p className="font-medium">Lead creado desde {lead.cliente?.origen_lead}</p>
                                                    <p className="text-sm text-muted-foreground">{formatDate(lead.fecha_creacion)}</p>
                                                </div>
                                            </div>
                                            {lead.ultima_interaccion !== lead.fecha_creacion && (
                                                <div className="flex gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-warning mt-2" />
                                                    <div>
                                                        <p className="font-medium">Última interacción</p>
                                                        <p className="text-sm text-muted-foreground">{formatRelativeTime(lead.ultima_interaccion)}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {lead.fecha_cierre && (
                                                <div className="flex gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-success mt-2" />
                                                    <div>
                                                        <p className="font-medium">Lead cerrado</p>
                                                        <p className="text-sm text-muted-foreground">{formatDate(lead.fecha_cierre)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Notes Tab */}
                            <TabsContent value="notes" className="mt-0">
                                <Card className="card-premium">
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Notas del vendedor</h4>
                                            <p className="text-muted-foreground">
                                                {lead.notas || 'Sin notas'}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-2">Añadir nota</h4>
                                            <Textarea
                                                placeholder="Escribe una nota sobre este lead..."
                                                className="min-h-[100px]"
                                            />
                                            <Button className="mt-3">Guardar nota</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
