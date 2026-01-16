import { EditVehicleClient } from "./EditVehicleClient"

// Allow dynamic routes - all vehicles come from Supabase
export const dynamic = 'force-dynamic'

export default async function EditarVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <EditVehicleClient id={id} />
}
