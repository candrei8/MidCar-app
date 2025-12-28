import { VehicleDetailClient } from "./VehicleDetailClient"
import { mockVehicles } from "@/lib/mock-data"

export function generateStaticParams() {
    return mockVehicles.map((vehicle) => ({
        id: vehicle.id,
    }))
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <VehicleDetailClient id={id} />
}