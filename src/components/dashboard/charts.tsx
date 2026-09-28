"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CHART, numFmt, pctFmt } from "@/lib/dashboard-format"

// ============================================================================
// ESCALA
// ============================================================================

/** Máximo "redondo" del eje para que las líneas guía caigan en valores legibles */
function niceMax(value: number): number {
    if (value <= 0) return 1
    const exp = Math.pow(10, Math.floor(Math.log10(value)))
    const f = value / exp
    const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
    return (steps.find(s => f <= s) ?? 10) * exp
}

// ============================================================================
// TOOLTIP
// ============================================================================

/**
 * Tooltip oscuro. Los colores van en CSS (.dash-tooltip), no con text-white:
 * globals.css reescribe .text-white a oscuro en modo claro.
 */
export function TooltipBox({ title, rows, note }: { title: string; rows: { label: string; value: string; strong?: boolean }[]; note?: string }) {
    return (
        <div className="flex min-w-[168px] flex-col gap-1.5">
            <p className="dash-tooltip-title">{title}</p>
            <div className="flex flex-col gap-1">
                {rows.map(r => (
                    <div key={r.label} className="flex items-baseline justify-between gap-4">
                        <span className="dash-tooltip-muted">{r.label}</span>
                        <span className={cn("tabular-nums", r.strong ? "font-bold" : "font-semibold")}>{r.value}</span>
                    </div>
                ))}
            </div>
            {note && <p className="dash-tooltip-note">{note}</p>}
        </div>
    )
}

// ============================================================================
// COLUMNAS (serie mensual)
// ============================================================================

export interface Columna {
    key: string
    label: string
    value: number
    tooltip: ReactNode
}

/**
 * Columnas verticales con eje en cero, líneas guía tenues y tooltip por barra.
 * Admite negativos. El último punto puede marcarse como "en curso" (rayado).
 */
export function ColumnChart({
    data,
    formatAxis,
    formatValue,
    color = CHART.primary,
    height = 200,
    partialLast = false,
    ariaLabel,
}: {
    data: Columna[]
    formatAxis: (v: number) => string
    formatValue: (v: number) => string
    color?: string
    height?: number
    partialLast?: boolean
    ariaLabel: string
}) {
    const [active, setActive] = useState<number | null>(null)
    const maxPos = niceMax(Math.max(0, ...data.map(d => d.value)))
    const minNeg = Math.min(0, ...data.map(d => d.value))
    const negSpan = minNeg < 0 ? niceMax(-minNeg) : 0
    const total = maxPos + negSpan
    const zeroPct = (maxPos / total) * 100
    const ticks = [maxPos, maxPos / 2, 0, ...(negSpan ? [-negSpan] : [])]
    const yOf = (t: number) => ((maxPos - t) / total) * 100
    const lastIdx = data.length - 1

    return (
        <div role="figure" aria-label={ariaLabel}>
            <div className="flex gap-3">
                {/* Eje Y */}
                <div className="relative w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-400" style={{ height }} aria-hidden>
                    {ticks.map(t => (
                        <span key={t} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${yOf(t)}%` }}>
                            {formatAxis(t)}
                        </span>
                    ))}
                </div>

                {/* Área de dibujo */}
                <div className="relative flex-1" style={{ height }}>
                    {ticks.map(t => (
                        <div
                            key={t}
                            className="absolute inset-x-0"
                            style={{ top: `${yOf(t)}%`, borderTop: t === 0 ? '1px solid #cbd5e1' : `1px dashed ${CHART.grid}` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-stretch gap-1 sm:gap-1.5">
                        {data.map((d, i) => {
                            const h = (Math.abs(d.value) / total) * 100
                            const positive = d.value >= 0
                            const isActive = active === i
                            const partial = partialLast && i === lastIdx
                            const fill = positive ? color : CHART.negative
                            return (
                                <button
                                    key={d.key}
                                    type="button"
                                    className="relative flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    onMouseEnter={() => setActive(i)}
                                    onMouseLeave={() => setActive(null)}
                                    onFocus={() => setActive(i)}
                                    onBlur={() => setActive(null)}
                                    aria-label={`${d.label}${partial ? ' (en curso)' : ''}: ${formatValue(d.value)}`}
                                >
                                    <span className={cn("absolute inset-0 rounded-lg transition-colors duration-150", isActive ? "bg-slate-100" : "bg-transparent")} />
                                    {d.value !== 0 && (
                                        <span
                                            className="absolute left-1/2 w-[64%] max-w-[36px] -translate-x-1/2 transition-opacity duration-150"
                                            style={{
                                                height: `${h}%`,
                                                ...(positive
                                                    ? { bottom: `${100 - zeroPct}%`, borderRadius: '5px 5px 1px 1px' }
                                                    : { top: `${zeroPct}%`, borderRadius: '1px 1px 5px 5px' }),
                                                background: partial
                                                    ? `repeating-linear-gradient(135deg, ${fill} 0 4px, ${fill}99 4px 7px)`
                                                    : fill,
                                                opacity: active === null || isActive ? 1 : 0.35,
                                            }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tooltip con flecha, anclado a la barra activa */}
                    {active !== null && (
                        <div
                            className="dash-tooltip pointer-events-none absolute z-20"
                            style={{
                                left: `${((active + 0.5) / data.length) * 100}%`,
                                top: `${data[active].value >= 0 ? yOf(Math.max(0, data[active].value)) : zeroPct}%`,
                                transform: `translate(${active < 2 ? '-18%' : active > data.length - 3 ? '-82%' : '-50%'}, calc(-100% - 10px))`,
                            }}
                            role="tooltip"
                        >
                            {data[active].tooltip}
                            <span
                                className="dash-tooltip-arrow"
                                style={{ left: active < 2 ? '18%' : active > data.length - 3 ? '82%' : '50%' }}
                                aria-hidden
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Eje X */}
            <div className="ml-[68px] mt-2.5 flex gap-1 sm:gap-1.5" aria-hidden>
                {data.map((d, i) => (
                    <span
                        key={d.key}
                        className={cn(
                            "flex-1 text-center text-[11px] capitalize transition-colors",
                            active === i ? "font-semibold text-slate-900" : "text-slate-400",
                            i % 2 === 1 && data.length > 8 && active !== i && "max-sm:invisible",
                        )}
                    >
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// BARRA APILADA (proporciones)
// ============================================================================

export function StackedBar({ parts, height = 8 }: { parts: { key: string; value: number; color: string; label: string }[]; height?: number }) {
    const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0)
    if (total <= 0) return <div className="rounded-full bg-slate-100" style={{ height }} />
    return (
        <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }} role="img" aria-label={parts.map(p => p.label).join(', ')}>
            {parts.filter(p => p.value > 0).map(p => (
                <span key={p.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ flexGrow: p.value, flexBasis: 0, background: p.color }} title={p.label} />
            ))}
        </div>
    )
}

// ============================================================================
// BARRAS HORIZONTALES
// ============================================================================

export interface BarraH {
    key: string
    label: ReactNode
    value: number
    valueLabel: string
    sublabel?: string
    color?: string
    href?: string
    marker?: ReactNode
}

/** Barras horizontales con etiqueta a la izquierda y valor a la derecha */
export function HBars({ data, max: maxProp }: { data: BarraH[]; max?: number }) {
    const max = maxProp ?? Math.max(1, ...data.map(d => Math.abs(d.value)))
    return (
        <ul className="flex flex-col gap-1">
            {data.map(d => {
                const w = d.value === 0 ? 0 : Math.max(3, (Math.abs(d.value) / max) * 100)
                const row = (
                    <>
                        <div className="flex items-baseline justify-between gap-3 text-[13px]">
                            <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                                <span className="truncate">{d.label}</span>
                                {d.marker}
                            </span>
                            <span className="shrink-0 tabular-nums">
                                <span className="font-bold text-slate-900">{d.valueLabel}</span>
                                {d.sublabel && <span className="ml-2 text-slate-400">{d.sublabel}</span>}
                            </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full transition-[width] duration-500 ease-out"
                                style={{ width: `${w}%`, backgroundColor: d.color ?? CHART.primary }}
                            />
                        </div>
                    </>
                )
                return (
                    <li key={d.key}>
                        {d.href ? (
                            <Link href={d.href} className="-mx-2.5 block rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30">
                                {row}
                            </Link>
                        ) : (
                            <div className="-mx-2.5 px-2.5 py-2">{row}</div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

// ============================================================================
// MARGEN (divergente: ganancias a la derecha, pérdidas a la izquierda del cero)
// ============================================================================

export interface BarraMargen {
    key: string
    label: string
    sublabel: string
    value: number
    valueLabel: string
    href: string
}

export function MarginBars({ data, scale: scaleProp }: { data: BarraMargen[]; scale?: { pos: number; neg: number } }) {
    const pos = scaleProp?.pos ?? Math.max(0, ...data.map(d => d.value))
    const neg = scaleProp?.neg ?? Math.max(0, ...data.map(d => -d.value))
    const span = pos + neg || 1
    const zero = (neg / span) * 100
    return (
        <ul className="flex flex-col">
            {data.map(d => {
                const w = (Math.abs(d.value) / span) * 100
                const isNeg = d.value < 0
                return (
                    <li key={d.key}>
                        <Link
                            href={d.href}
                            className="-mx-2.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-4 rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-[13px] font-semibold text-slate-800">{d.label}</span>
                                <span className="block truncate text-xs text-slate-500">{d.sublabel}</span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span className="relative h-2 flex-1 rounded-full bg-slate-100">
                                    {neg > 0 && <span className="absolute -inset-y-1 w-px bg-slate-300" style={{ left: `${zero}%` }} />}
                                    <span
                                        className="absolute inset-y-0 rounded-full"
                                        style={{
                                            backgroundColor: isNeg ? CHART.negative : CHART.primary,
                                            width: `${Math.max(w, 1.5)}%`,
                                            left: isNeg ? `${zero - w}%` : `${zero}%`,
                                        }}
                                    />
                                </span>
                                <span className={cn("w-[78px] shrink-0 text-right text-[13px] font-bold tabular-nums", isNeg ? "text-red-700" : "text-slate-900")}>
                                    {d.valueLabel}
                                </span>
                            </span>
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

// ============================================================================
// MIX: STOCK vs VENTAS (barras emparejadas)
// ============================================================================

export interface FilaPareada {
    key: string
    label: string
    a: number
    b: number
    aLabel: string
    bLabel: string
    href?: string
}

export function PairedBars({ data, aName, bName }: { data: FilaPareada[]; aName: string; bName: string }) {
    const max = Math.max(1, ...data.flatMap(d => [d.a, d.b]))
    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: CHART.primary }} aria-hidden />{aName}</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: CHART.accent }} aria-hidden />{bName}</span>
            </div>
            <ul className="flex flex-col">
                {data.map(d => {
                    const content = (
                        <div className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[124px_minmax(0,1fr)]">
                            <span className="truncate text-[13px] font-medium text-slate-700" title={d.label}>{d.label}</span>
                            <span className="flex flex-col gap-[3px]">
                                {[
                                    { v: d.a, l: d.aLabel, c: CHART.primary, n: aName },
                                    { v: d.b, l: d.bLabel, c: CHART.accent, n: bName },
                                ].map(bar => (
                                    <span key={bar.n} className="flex items-center gap-2">
                                        <span className="h-[7px] rounded-r-full" style={{ width: `${bar.v > 0 ? Math.max(1.5, (bar.v / max) * 78) : 0}%`, background: bar.c }} />
                                        <span className="whitespace-nowrap text-[11px] tabular-nums text-slate-500">
                                            <span className="sr-only">{bar.n}: </span>{bar.l}
                                        </span>
                                    </span>
                                ))}
                            </span>
                        </div>
                    )
                    return (
                        <li key={d.key}>
                            {d.href ? (
                                <Link href={d.href} className="-mx-2.5 block rounded-xl px-2.5 py-1.5 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30">{content}</Link>
                            ) : <div className="-mx-2.5 px-2.5 py-1.5">{content}</div>}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

// ============================================================================
// EMBUDO
// ============================================================================

export function Funnel({ steps }: { steps: { label: string; value: number; href?: string; icon: string }[] }) {
    const max = Math.max(1, steps[0]?.value ?? 1)
    return (
        <ol className="flex flex-col">
            {steps.map((s, i) => {
                const prev = i > 0 ? steps[i - 1].value : null
                const conv = prev ? (s.value / prev) * 100 : null
                const w = s.value > 0 ? Math.max(4, (s.value / max) * 100) : 0
                const body = (
                    <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>{s.icon}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-[13px] font-medium text-slate-700">{s.label}</span>
                                <span className="text-[15px] font-bold tabular-nums text-slate-900">{numFmt(s.value)}</span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${w}%`, background: CHART.primary, opacity: 1 - i * 0.22 }} />
                            </div>
                        </div>
                    </div>
                )
                return (
                    <li key={s.label}>
                        {conv !== null && (
                            <p className="flex items-center gap-1 py-1 pl-[46px] text-[11px] text-slate-500">
                                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 14 }} aria-hidden>south</span>
                                {prev === 0 ? 'Sin base para calcular' : `${pctFmt(conv)} pasan a este paso`}
                            </p>
                        )}
                        {s.href ? (
                            <Link href={s.href} className="-mx-2.5 block rounded-xl px-2.5 py-1.5 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary/30">{body}</Link>
                        ) : <div className="-mx-2.5 px-2.5 py-1.5">{body}</div>}
                    </li>
                )
            })}
        </ol>
    )
}
