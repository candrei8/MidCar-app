"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter, notFound } from "next/navigation"
import { QuickEditForm } from "@/components/inventory/QuickEditForm"
import { mockVehicles } from "@/lib/mock-data"
import type { Vehicle } from "@/types"

interface EditVehicleClientProps {
    id: string
}

export function EditVehicleClient({ id }: EditVehicleClientProps) {
    const router = useRouter()

    const vehicle = mockVehicles.find(v => v.id === id)

    if (!vehicle) {
        notFound()
    }

    const handleSave = (updatedVehicle: Vehicle) => {
        // Vehicle is already saved in QuickEditForm
        // Optionally refresh or show notification
    }

    const handleCancel = () => {
        router.push(`/inventario/${id}`)
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4">
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
