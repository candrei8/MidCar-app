/**
 * Formatos y colores de los gráficos del dashboard (es-ES).
 * Un solo sitio para que todos los gráficos hablen igual.
 */

export const CHART = {
    /** Serie principal (marca MIDCar) */
    primary: '#135bec',
    /** Segunda serie en comparaciones (validado vs primary: ΔE CVD 30.7) */
    accent: '#eb6834',
    /** Valores negativos (pérdidas) */
    negative: '#dc2626',
    /** Rampa secuencial de antigüedad: un solo tono, de claro a oscuro */
    aging: ['#bfd3fb', '#8fb2f7', '#5b8df2', '#2f69e6', '#1646b0'],
    grid: '#eef1f5',
    muted: '#94a3b8',
}

// es-ES no agrupa números de 4 cifras ("4607 €"); en un panel de negocio se
// lee mejor siempre con punto de miles ("4.607 €")
const GROUP = { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, ...GROUP })
const num = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, ...GROUP })
const pct = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 0 })

export function eurFmt(value: number): string {
    return eur.format(Math.round(value))
}

/** 23.450 € → "23,5 mil €"; para ejes y etiquetas pequeñas */
export function eurCompact(value: number): string {
    const abs = Math.abs(value)
    const sign = value < 0 ? '−' : ''
    if (abs >= 1_000_000) return `${sign}${pct.format(abs / 1_000_000)} M€`
    if (abs >= 1_000) return `${sign}${num.format(Math.round(abs / 1_000))} mil €`
    return `${sign}${num.format(abs)} €`
}

export function numFmt(value: number): string {
    return num.format(value)
}

export function pctFmt(value: number): string {
    return `${pct.format(value)} %`
}

/** "+12 %" / "−8 %" con signo tipográfico real */
export function deltaFmt(value: number): string {
    const rounded = Math.round(value)
    if (rounded === 0) return '0 %'
    return `${rounded > 0 ? '+' : '−'}${num.format(Math.abs(rounded))} %`
}

export function fechaCorta(d: Date): string {
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')
}

export function fechaLarga(d: Date): string {
    const s = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export function plural(n: number, uno: string, varios: string): string {
    return `${numFmt(n)} ${n === 1 ? uno : varios}`
}
