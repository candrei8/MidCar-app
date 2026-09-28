"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CandidatoRebaja, TipoVencimiento, Vencimiento, Venta } from "@/lib/dashboard-metrics"
import { eurFmt, fechaCorta, pctFmt } from "@/lib/dashboard-format"
import { modeloCorto } from "@/lib/vehicle-name"

const MARCA_ALIAS: Record<string, string[]> = {
    VOLKSWAGEN: ['VW'],
    'MERCEDES-BENZ': ['MERCEDES'],
}

/** "Marca Modelo" corto. Algunos coches importados tienen el modelo truncado
 *  a una letra ("C") y el nombre real en la versión ("Custom Van 2.0…") */
export function nombreCoche(v: { marca?: string | null; modelo?: string | null; version?: string | null }): string {
    const marca = (v.marca || '').trim()
    let modelo = (v.modelo || '').trim()
    if (modelo.length <= 2 && v.version) modelo = v.version.trim()
    // Quita la marca repetida al principio del modelo ("Volkswagen Vw Passat")
    const alias = [marca.toUpperCase(), ...(MARCA_ALIAS[marca.toUpperCase()] ?? [])]
    const [first, ...rest] = modelo.split(/\s+/)
    if (rest.length > 0 && alias.includes((first || '').toUpperCase())) modelo = rest.join(' ')
    return `${marca} ${modeloCorto(modelo)}`.trim()
}

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
    return (
        <img
            src={src || '/placeholder-proximamente.svg'}
            alt={alt}
            width={64}
            height={48}
            loading="lazy"
            decoding="async"
            className="h-12 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
        />
    )
}

function DiasChip({ dias }: { dias: number }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                dias > 120 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800",
            )}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden>schedule</span>
            {dias} días
        </span>
    )
}

// ============================================================================
// COCHES PARA REBAJAR
// ============================================================================

export function RebajarList({ items }: { items: CandidatoRebaja[] }) {
    return (
        <ul className="-mx-2 flex flex-col">
            {items.map(c => {
                const v = c.vehicle
                return (
                    <li key={v.id}>
                        <Link
                            href={`/inventario/${v.id}`}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <Thumb src={v.imagen_principal} alt={nombreCoche(v)} />
                            <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">{nombreCoche(v)}</p>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                        {v.matricula || 'Sin matrícula'}
                                        <span className="sm:hidden"> · {eurFmt(c.pvp)}</span>
                                    </p>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[11px] text-slate-400">Precio</p>
                                    <p className="text-sm font-semibold tabular-nums text-slate-900">{eurFmt(c.pvp)}</p>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[11px] text-slate-400">Margen actual</p>
                                    {c.margen !== null ? (
                                        <p className={cn("text-sm font-semibold tabular-nums", c.margen < 0 ? "text-red-700" : "text-slate-900")}>
                                            {eurFmt(c.margen)}
                                            {c.margenPct !== null && <span className="ml-1 text-xs font-normal text-slate-500">{pctFmt(c.margenPct)}</span>}
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-amber-700">Falta el coste</p>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0">
                                <DiasChip dias={c.dias} />
                            </div>
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

// ============================================================================
// VENCIMIENTOS
// ============================================================================

const TIPO: Record<TipoVencimiento, { icon: string; cls: string }> = {
    itv: { icon: 'verified', cls: 'bg-sky-50 text-sky-700' },
    seguro: { icon: 'shield', cls: 'bg-violet-50 text-violet-700' },
    reserva: { icon: 'bookmark', cls: 'bg-amber-50 text-amber-700' },
    factura: { icon: 'receipt_long', cls: 'bg-emerald-50 text-emerald-700' },
    tarea: { icon: 'task_alt', cls: 'bg-slate-100 text-slate-600' },
}

function cuando(dias: number): { text: string; urgent: boolean; overdue: boolean } {
    if (dias < 0) return { text: dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`, urgent: true, overdue: true }
    if (dias === 0) return { text: 'Hoy', urgent: true, overdue: false }
    if (dias === 1) return { text: 'Mañana', urgent: true, overdue: false }
    return { text: `En ${dias} días`, urgent: dias <= 7, overdue: false }
}

export function VencimientosList({ items }: { items: Vencimiento[] }) {
    return (
        <ul className="-mx-2 flex flex-col">
            {items.map(item => {
                const t = TIPO[item.tipo]
                const c = cuando(item.dias)
                return (
                    <li key={item.id}>
                        <Link
                            href={item.enlace}
                            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", t.cls)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>{t.icon}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">{item.titulo}</p>
                                <p className="truncate text-xs text-slate-500">{item.detalle}</p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className={cn(
                                    "text-xs font-bold",
                                    c.overdue ? "text-red-700" : c.urgent ? "text-amber-700" : "text-slate-600",
                                )}>
                                    {c.overdue && <span className="material-symbols-outlined mr-0.5 align-[-3px]" style={{ fontSize: 14 }} aria-hidden>error</span>}
                                    {c.text}
                                </p>
                                <p className="text-[11px] text-slate-400">{fechaCorta(item.fecha)}</p>
                            </div>
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

// ============================================================================
// ÚLTIMAS VENTAS
// ============================================================================

export function UltimasVentas({ items }: { items: Venta[] }) {
    return (
        <ul className="-mx-2 flex flex-col">
            {items.map(v => (
                <li key={v.vehicle.id}>
                    <Link
                        href={`/inventario/${v.vehicle.id}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                        <Thumb src={v.vehicle.imagen_principal} alt={nombreCoche(v.vehicle)} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{nombreCoche(v.vehicle)}</p>
                            <p className="text-xs text-slate-500">
                                {fechaCorta(v.fecha)}
                                {v.origenFecha === 'aprox' && <span className="text-slate-400"> · fecha aprox.</span>}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-sm font-bold tabular-nums text-slate-900">{eurFmt(v.precio)}</p>
                            <p className={cn("text-[11px] tabular-nums", v.margen === null ? "text-slate-400" : v.margen < 0 ? "text-red-700" : "text-emerald-700")}>
                                {v.margen === null ? 'sin coste' : `${v.margen >= 0 ? '+' : ''}${eurFmt(v.margen)}`}
                            </p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
