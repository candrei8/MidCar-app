"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Building2,
    Bell,
    Shield,
    Link,
    Save,
} from "lucide-react"
import { BUSINESS_INFO } from "@/lib/constants"

export default function ConfiguracionPage() {
    return (
        <div className="space-y-6 animate-in">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
                    <p className="text-muted-foreground">
                        Ajustes del sistema y preferencias de la aplicación
                    </p>
                </div>
                <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Guardar cambios
                </Button>
            </div>

            <Tabs defaultValue="negocio" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="negocio" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Negocio
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="integraciones" className="gap-2">
                        <Link className="h-4 w-4" />
                        Integraciones
                    </TabsTrigger>
                    <TabsTrigger value="seguridad" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Seguridad
                    </TabsTrigger>
                </TabsList>

                {/* Business Settings */}
                <TabsContent value="negocio">
                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Información del Negocio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre comercial</Label>
                                    <Input id="nombre" defaultValue={BUSINESS_INFO.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="razon">Razón social</Label>
                                    <Input id="razon" defaultValue={BUSINESS_INFO.fullName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cif">CIF</Label>
                                    <Input id="cif" placeholder="B12345678" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input id="telefono" defaultValue={BUSINESS_INFO.phone} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={BUSINESS_INFO.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="web">Sitio web</Label>
                                    <Input id="web" defaultValue={BUSINESS_INFO.website} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="direccion">Dirección</Label>
                                <Input id="direccion" defaultValue={BUSINESS_INFO.address} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="horario">Horario de atención</Label>
                                <Input id="horario" defaultValue={BUSINESS_INFO.schedule} />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo del negocio</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-surface-200 rounded-lg flex items-center justify-center">
                                        <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">M</span>
                                        </div>
                                    </div>
                                    <Button variant="outline">Cambiar logo</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notificaciones">
                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Preferencias de Notificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Nuevo lead</p>
                                            <p className="text-sm text-muted-foreground">Recibir email cuando se capture un lead</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Venta realizada</p>
                                            <p className="text-sm text-muted-foreground">Notificar cuando se complete una venta</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Reporte semanal</p>
                                            <p className="text-sm text-muted-foreground">Enviar resumen cada lunes a las 9:00</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Push / En la app</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Nuevo lead</p>
                                            <p className="text-sm text-muted-foreground">Mostrar notificación en tiempo real</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Alerta de stock</p>
                                            <p className="text-sm text-muted-foreground">Vehículo más de 60 días en stock</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">Recordatorio de seguimiento</p>
                                            <p className="text-sm text-muted-foreground">Avisar de acciones pendientes</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Settings */}
                <TabsContent value="integraciones">
                    <div className="space-y-6">
                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">API Keys</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="resend">Resend API Key</Label>
                                    <Input id="resend" type="password" placeholder="re_..." />
                                    <p className="text-xs text-muted-foreground">Para envío de emails transaccionales</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="supabase">Supabase URL</Label>
                                    <Input id="supabase" placeholder="https://xxxxx.supabase.co" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                                    <Input id="supabase-key" type="password" placeholder="eyJ..." />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Servicios externos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-surface-100 rounded-lg">
                                    <div>
                                        <p className="font-medium text-foreground">WhatsApp Business</p>
                                        <p className="text-sm text-muted-foreground">Integración con Twilio</p>
                                    </div>
                                    <Button variant="outline" size="sm">Configurar</Button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-surface-100 rounded-lg">
                                    <div>
                                        <p className="font-medium text-foreground">Google Analytics</p>
                                        <p className="text-sm text-muted-foreground">Seguimiento de conversiones</p>
                                    </div>
                                    <Button variant="outline" size="sm">Configurar</Button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-surface-100 rounded-lg">
                                    <div>
                                        <p className="font-medium text-foreground">CARFAX API</p>
                                        <p className="text-sm text-muted-foreground">Informes de historial de vehículos</p>
                                    </div>
                                    <Button variant="outline" size="sm">Configurar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="seguridad">
                    <div className="space-y-6">
                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Seguridad de la Cuenta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Autenticación de dos factores (2FA)</p>
                                        <p className="text-sm text-muted-foreground">Obligatorio para administradores</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Expiración de sesión</p>
                                        <p className="text-sm text-muted-foreground">Cerrar sesión tras inactividad</p>
                                    </div>
                                    <Select defaultValue="8h">
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1h">1 hora</SelectItem>
                                            <SelectItem value="4h">4 horas</SelectItem>
                                            <SelectItem value="8h">8 horas</SelectItem>
                                            <SelectItem value="24h">24 horas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Política de Contraseñas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground">Longitud mínima</p>
                                    <span className="font-medium">8 caracteres</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground">Requiere mayúsculas</p>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground">Requiere números</p>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground">Requiere caracteres especiales</p>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Logs de Auditoría</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">Últimas acciones críticas registradas</p>
                                <div className="space-y-2">
                                    {[
                                        { action: 'Inicio de sesión', user: 'Admin Demo', time: 'Hace 2 minutos' },
                                        { action: 'Vehículo editado (MC-003)', user: 'María López', time: 'Hace 1 hora' },
                                        { action: 'Configuración modificada', user: 'Admin Demo', time: 'Ayer' },
                                    ].map((log, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-surface-100 rounded-lg text-sm">
                                            <div>
                                                <span className="font-medium text-foreground">{log.action}</span>
                                                <span className="text-muted-foreground"> por {log.user}</span>
                                            </div>
                                            <span className="text-muted">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" className="mt-4 text-primary">
                                    Ver todos los logs
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}