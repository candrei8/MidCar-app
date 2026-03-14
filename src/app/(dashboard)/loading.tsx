export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-t-primary border-white/10 rounded-full animate-spin" />
                <span className="text-sm text-white/40">Cargando...</span>
            </div>
        </div>
    )
}
