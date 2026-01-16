import { VehicleDetailClient } from "./VehicleDetailClient"

// Allow dynamic routes - all vehicles come from Supabase
export const dynamic = 'force-dynamic'

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <VehicleDetailClient id={id} />
}
