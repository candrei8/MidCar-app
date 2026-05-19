"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"

interface FeedMetadata {
    id: string
    last_generated_at: string | null
    item_count: number
    status: 'pending' | 'ok' | 'error'
    error_message: string | null
    triggered_by: string | null
    updated_at: string
}

function formatTimestamp(iso: string | null): string {
    if (!iso) return 'Nunca'
    try {
        return new Date(iso).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch {
        return iso
    }
}

export default function GoogleMerchantConfigPage() {
    const { session } = useAuth()
    const { addToast } = useToast()
    const [metadata, setMetadata] = useState<FeedMetadata | null>(null)
    const [loading, setLoading] = useState(true)
    const [regenerating, setRegenerating] = useState(false)
    const [origin, setOrigin] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin)
    }, [])

    const feedUrl = origin ? `${origin}/api/feeds/merchant.xml` : '/api/feeds/merchant.xml'
    const feedTestUrl = origin ? `${origin}/api/feeds/merchant.xml?test=true` : '/api/feeds/merchant.xml?test=true'

    const loadMetadata = useCallback(async () => {
        if (!session?.access_token) {
            setLoading(false)
            return
        }
        try {
            const res = await fetch('/api/feeds/merchant/regenerate', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            const json = await res.json()
            setMetadata(json.metadata || null)
        } catch (err) {
            console.error('Failed to load feed metadata', err)
        } finally {
            setLoading(false)
        }
    }, [session?.access_token])

    useEffect(() => {
        loadMetadata()
    }, [loadMetadata])

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            addToast('URL copiada al portapapeles', 'success')
        } catch {
            addToast('No se pudo copiar la URL', 'error')
        }
    }

    const handleRegenerate = async () => {
        if (!session?.access_token) {
            addToast('Sesión requerida', 'error')
            return
        }
        setRegenerating(true)
        try {
            const res = await fetch('/api/feeds/merchant/regenerate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || json.details || `HTTP ${res.status}`)
            }
            addToast(
                `Feed regenerado con ${json.itemCount} vehículo${json.itemCount === 1 ? '' : 's'}`,
                'success'
            )
            await loadMetadata()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido'
            addToast(`Fallo al regenerar: ${msg}`, 'error')
        } finally {
            setRegenerating(false)
        }
    }

    const statusBadge = (status: FeedMetadata['status'] | undefined) => {
        if (!status || status === 'pending') {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">Sin generar</span>
        }
        if (status === 'ok') {
            return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">OK</span>
        }
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Error</span>
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Link href="/configuracion" className="hover:text-[#135bec]">
                            Configuración
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700">Google Merchant</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#135bec]">rss_feed</span>
                        Feed de Google Merchant
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Catálogo XML que Google usa para mostrar tus coches en Shopping. Se regenera cada día automáticamente.
                    </p>
                </div>
            </header>

            <main className="p-4 md:p-6 space-y-6 max-w-4xl">

                {/* Estado actual */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">monitoring</span>
                        Estado de la última generación
                    </h2>
                    {loading ? (
                        <p className="text-sm text-slate-500">Cargando…</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
                                <div className="mt-1">{statusBadge(metadata?.status)}</div>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Última generación</p>
                                <p className="mt-1 text-slate-900 font-medium">
                                    {formatTimestamp(metadata?.last_generated_at || null)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Vehículos publicados</p>
                                <p className="mt-1 text-slate-900 font-medium">{metadata?.item_count ?? 0}</p>
                            </div>
                            {metadata?.error_message && (
                                <div className="md:col-span-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                                    <strong>Último error:</strong> {metadata.error_message}
                                </div>
                            )}
                            {metadata?.triggered_by && (
                                <p className="md:col-span-3 text-xs text-slate-400">
                                    Disparado por: <code>{metadata.triggered_by}</code>
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* URL del feed */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">link</span>
                        URL del feed
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                        Pasa esta URL al equipo SEO. Es la dirección que se carga en Google Merchant Center.
                    </p>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-slate-700">Feed completo (producción)</label>
                            <div className="mt-1 flex gap-2">
                                <code className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 break-all">
                                    {feedUrl}
                                </code>
                                <Button
                                    type="button"
                                    onClick={() => handleCopy(feedUrl)}
                                    className="bg-[#135bec] hover:bg-blue-700 text-white shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px] mr-1">content_copy</span>
                                    Copiar
                                </Button>
                                <a
                                    href={feedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0"
                                >
                                    <Button type="button" variant="outline">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </Button>
                                </a>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700">
                                Feed de test (sólo 2 vehículos — para validar inicialmente en Google)
                            </label>
                            <div className="mt-1 flex gap-2">
                                <code className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono text-slate-900 break-all">
                                    {feedTestUrl}
                                </code>
                                <Button
                                    type="button"
                                    onClick={() => handleCopy(feedTestUrl)}
                                    variant="outline"
                                    className="shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px] mr-1">content_copy</span>
                                    Copiar
                                </Button>
                                <a
                                    href={feedTestUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0"
                                >
                                    <Button type="button" variant="outline">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Acción manual */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">refresh</span>
                        Regenerar ahora
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                        El feed se actualiza automáticamente cada día. Usa este botón si subes un coche nuevo o cambias un precio
                        y quieres que aparezca en Google inmediatamente.
                    </p>
                    <Button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="bg-[#135bec] hover:bg-blue-700 text-white"
                    >
                        {regenerating ? (
                            <>
                                <span className="material-symbols-outlined text-[16px] mr-1 animate-spin">progress_activity</span>
                                Regenerando…
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px] mr-1">refresh</span>
                                Regenerar feed ahora
                            </>
                        )}
                    </Button>
                </section>

                {/* Reglas de inclusión */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">checklist</span>
                        Qué vehículos entran en el feed
                    </h2>
                    <ul className="text-sm text-slate-700 space-y-1.5">
                        <li className="flex gap-2">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 mt-0.5">check_circle</span>
                            Estado <code className="px-1 bg-slate-100 rounded">disponible</code> o <code className="px-1 bg-slate-100 rounded">reservado</code>
                        </li>
                        <li className="flex gap-2">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 mt-0.5">check_circle</span>
                            Precio de venta &gt; 0 €
                        </li>
                        <li className="flex gap-2">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 mt-0.5">check_circle</span>
                            Imagen principal con URL HTTPS válida
                        </li>
                        <li className="flex gap-2">
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 mt-0.5">check_circle</span>
                            Toggle <em>“Incluir en feed Google”</em> activado en la ficha del vehículo (por defecto, sí)
                        </li>
                        <li className="flex gap-2">
                            <span className="material-symbols-outlined text-[16px] text-red-500 mt-0.5">cancel</span>
                            Se excluyen vehículos en estado <code className="px-1 bg-slate-100 rounded">vendido</code>, <code className="px-1 bg-slate-100 rounded">taller</code> o <code className="px-1 bg-slate-100 rounded">baja</code>
                        </li>
                    </ul>
                </section>

            </main>
        </div>
    )
}
