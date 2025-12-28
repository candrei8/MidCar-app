import { EditVehicleClient } from "./EditVehicleClient"
import { mockVehicles } from "@/lib/mock-data"

export function generateStaticParams() {
    return mockVehicles.map((vehicle) => ({
        id: vehicle.id,
    }))
}

export default async function EditarVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EditVehicleClient id={id} />
}
