"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QuickEditForm } from "@/components/inventory/QuickEditForm"
import { getVehicleById } from "@/lib/supabase-service"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle } from "@/types"

interface EditVehicleClientProps {
    id: string
}

export function EditVehicleClient({ id }: EditVehicleClientProps) {
    const router = useRouter()
    const { user } = useAuth()

    const [vehicle, setVehicle] = useState<Vehicle | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load vehicle from Supabase
    useEffect(() => {
        const loadVehicle = async () => {
            setIsLoading(true)
            const vehicleData = await getVehicleById(id)
            setVehicle(vehicleData)
            setIsLoading(false)
        }
        loadVehicle()
    }, [id])

    const handleSave = (updatedVehicle: Vehicle) => {
        // Vehicle is already saved in QuickEditForm
        setVehicle(updatedVehicle)
        // Navigate back after save
        router.push(`/inventario/${id}`)
    }

    const handleCancel = () => {
        router.push(`/inventario/${id}`)
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent" />
                    <p className="text-muted-foreground font-medium">Cargando vehículo...</p>
                </div>
            </div>
        )
    }

    if (!vehicle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-gray-400">search_off</span>
                </div>
                <h2 className="text-xl font-bold text-foreground text-center">Vehículo no encontrado</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    El vehículo que buscas no existe o ha sido eliminado.
                </p>
                <Link href="/inventario">
                    <Button className="mt-2">
                        Volver al inventario
                    </Button>
                </Link>
            </div>
        )
    }

    // Verificar si el usuario actual puede editar este vehículo
    const canEdit = vehicle.created_by === user?.id

    // Si el usuario no puede editar, mostrar mensaje de acceso denegado
    if (!canEdit) {
        return (
            <div className="space-y-6 animate-in px-4">
                {/* Mobile-friendly back button */}
                <div className="flex items-center gap-3 -mx-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 lg:border-0">
                    <Link href={`/inventario/${id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <span className="font-semibold text-foreground">Editar vehículo</span>
                </div>

                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                        <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2 text-center">
                        No tienes permiso para editar
                    </h1>
                    <p className="text-muted-foreground text-center max-w-md mb-2">
                        Solo el creador de este vehículo puede editarlo.
                    </p>
                    {vehicle.created_by_name && (
                        <p className="text-sm text-muted-foreground">
                            Creado por: <span className="font-medium text-primary">{vehicle.created_by_name}</span>
                        </p>
                    )}
                    <Link href={`/inventario/${id}`} className="mt-6">
                        <Button size="lg" className="h-12 px-6">Volver al vehículo</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in">
            {/* Desktop Header - Hidden on mobile since QuickEditForm has its own */}
            <div className="hidden lg:flex items-center gap-4 mb-6">
                <Link href={`/inventario/${id}`}>
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Editar Vehículo</h1>
                    <p className="text-muted-foreground">
                        {vehicle.marca} {vehicle.modelo} - {vehicle.matricula}
                    </p>
                </div>
            </div>

            <QuickEditForm
                vehicleId={id}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </div>
    )
}
