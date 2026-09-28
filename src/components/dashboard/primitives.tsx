"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CHART, deltaFmt } from "@/lib/dashboard-format"

// ============================================================================
// CARD
// ============================================================================

export function Card({
    title,
    subtitle,
    action,
    badge,
    children,
    className,
}: {
    title: string
    subtitle?: string
    action?: { label: string; href: string }
    badge?: string
    children: ReactNode
    className?: string
}) {
    return (
        <section className={cn("dash-card flex flex-col", className)}>
            <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold leading-tight tracking-[-0.01em] text-slate-900">{title}</h2>
                        {badge && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="mt-1 text-[13px] leading-snug text-slate-500">{subtitle}</p>}
                </div>
                {action && (
                    <Link href={action.href} className="dash-link inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold">
                        {action.label}
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>arrow_forward</span>
                    </Link>
                )}
            </header>
            <div className="flex-1 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
        </section>
    )
}

export function EmptyState({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: { label: string; href: string } }) {
    return (
        <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
            <span className="mb-1.5 flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden>{icon}</span>
            </span>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {text && <p className="max-w-xs text-xs text-slate-500">{text}</p>}
            {action && <Link href={action.href} className="dash-link mt-1 text-xs font-bold">{action.label}</Link>}
        </div>
    )
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />
}

// ============================================================================
// DELTA
// ============================================================================

/**
 * Variación contra el periodo anterior. El color indica si es bueno o malo,
 * no si sube o baja; la flecha y el signo evitan depender solo del color.
 */
export function Delta({ value, goodWhenUp = true, label }: { value: number | null; goodWhenUp?: boolean; label: string }) {
    if (value === null || !isFinite(value)) {
        return <span className="text-xs text-slate-400">Sin datos para comparar</span>
    }
    const rounded = Math.round(value)
    const neutral = rounded === 0
    const good = neutral ? null : (rounded > 0) === goodWhenUp
    return (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <span
                className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold tabular-nums",
                    neutral && "bg-slate-100 text-slate-600",
                    good === true && "bg-emerald-50 text-emerald-700",
                    good === false && "bg-red-50 text-red-700",
                )}
            >
                <span aria-hidden>{neutral ? '=' : rounded > 0 ? '▲' : '▼'}</span>
                {deltaFmt(value)}
            </span>
            <span className="text-slate-500">{label}</span>
        </span>
    )
}

// ============================================================================
// SPARKLINE
// ============================================================================

export function Sparkline({ values, color = CHART.primary, label }: { values: number[]; color?: string; label: string }) {
    const w = 120
    const h = 32
    if (values.length < 2 || values.every(v => v === 0)) {
        return <div className="h-9" aria-hidden />
    }
    const max = Math.max(...values)
    const min = Math.min(0, ...values)
    const range = max - min || 1
    const step = w / (values.length - 1)
    const pts = values.map((v, i) => [i * step, h - 2 - ((v - min) / range) * (h - 4)] as const)
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    const area = `${line} L${w},${h} L0,${h} Z`
    const [lx, ly] = pts[pts.length - 1]
    return (
        <div className="relative h-9 w-full">
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label={label}>
                <path d={area} fill={color} opacity={0.08} />
                <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* Punto final en HTML: dentro del SVG estirado se deformaría en elipse */}
            <span
                className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                style={{ left: `${(lx / w) * 100}%`, top: `${(ly / h) * 100}%`, background: color }}
                aria-hidden
            />
        </div>
    )
}

// ============================================================================
// STAT TILE
// ============================================================================

export function StatTile({
    label,
    icon,
    value,
    detail,
    footer,
    spark,
    visual,
    href,
    tone = 'default',
    badge,
}: {
    label: string
    icon: string
    value: string
    detail?: ReactNode
    footer?: ReactNode
    spark?: { values: number[]; label: string }
    visual?: ReactNode
    href?: string
    tone?: 'default' | 'good' | 'warning' | 'bad'
    badge?: string
}) {
    const toneDot = {
        default: null,
        good: 'bg-emerald-500 ring-emerald-500/15',
        warning: 'bg-amber-500 ring-amber-500/15',
        bad: 'bg-red-500 ring-red-500/15',
    }[tone]
    const body = (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="hidden size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08] text-primary min-[380px]:flex">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>{icon}</span>
                    </span>
                    <span className="text-xs font-semibold leading-tight text-slate-600 sm:text-[13px]">{label}</span>
                </div>
                {badge && <span className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:inline">{badge}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2 sm:mt-4">
                {toneDot && <span className={cn("size-2.5 shrink-0 rounded-full ring-4", toneDot)} aria-hidden />}
                <p className="dash-hero truncate">{value}</p>
            </div>
            {detail && <div className="mt-1.5 line-clamp-2 text-xs text-slate-500 sm:truncate sm:text-[13px]">{detail}</div>}
            <div className="mt-4 hidden h-9 items-end sm:flex">
                {spark ? <Sparkline values={spark.values} label={spark.label} /> : visual}
            </div>
            {footer && <div className="mt-auto border-t border-slate-100 pt-3 max-sm:mt-3 sm:mt-3">{footer}</div>}
        </>
    )
    const cls = "dash-card flex h-full min-w-0 flex-col p-3.5 sm:p-5"
    return href ? (
        <Link href={href} className={cn(cls, "dash-interactive")}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    )
}
