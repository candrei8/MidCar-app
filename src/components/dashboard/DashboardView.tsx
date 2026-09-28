"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/types"
import type { DashboardExtras, ContactosPeriodo } from "@/hooks/useDashboardData"
import {
    DIAS_REBAJA, DIAS_RIESGO, DIAS_STOCK_AVISO, DIAS_STOCK_OK, PERIODOS,
    antiguedadStock, buildVentas, calcularKpis, candidatosRebaja, getRangoPeriodo, mix,
    rankingMargen, serieMensual, vencimientos,
    type DimensionMix, type MesSerie, type Periodo, type Venta,
} from "@/lib/dashboard-metrics"
import { CHART, eurCompact, eurFmt, fechaLarga, numFmt, pctFmt, plural } from "@/lib/dashboard-format"
import { Card, Delta, EmptyState, Skeleton, StatTile } from "./primitives"
import { ColumnChart, Funnel, HBars, MarginBars, PairedBars, StackedBar, TooltipBox } from "./charts"
import { RebajarList, UltimasVentas, VencimientosList, nombreCoche } from "./lists"

export interface DashboardViewProps {
    now: Date
    periodo: Periodo
    onPeriodoChange: (p: Periodo) => void
    vehicles: Vehicle[]
    extras: DashboardExtras | null
    contactosPeriodo: ContactosPeriodo | null
    error: string | null
    onRetry: () => void
}

type MetricaVentas = 'unidades' | 'margen' | 'ingresos'

const METRICAS: { key: MetricaVentas; label: string }[] = [
    { key: 'unidades', label: 'Coches' },
    { key: 'margen', label: 'Margen' },
    { key: 'ingresos', label: 'Ingresos' },
]

export function DashboardView({
    now, periodo, onPeriodoChange, vehicles, extras, contactosPeriodo, error, onRetry,
}: DashboardViewProps) {
    const [dimension, setDimension] = useState<DimensionMix>('marca')
    const [metrica, setMetrica] = useState<MetricaVentas>('unidades')

    const rango = useMemo(() => getRangoPeriodo(periodo, now), [periodo, now])
    const periodoLabel = PERIODOS.find(p => p.key === periodo)!.label.toLowerCase()

    // ---------------------------------------------------------------- métricas
    const ventas = useMemo(() => buildVentas(vehicles, extras?.contratos ?? [], extras?.facturas ?? []), [vehicles, extras])
    const kpis = useMemo(() => calcularKpis(vehicles, ventas, rango, now), [vehicles, ventas, rango, now])
    const serie = useMemo(() => serieMensual(ventas, now, 12), [ventas, now])
    const tramos = useMemo(() => antiguedadStock(vehicles, now), [vehicles, now])
    const rebajas = useMemo(() => candidatosRebaja(vehicles, now), [vehicles, now])
    const ranking = useMemo(() => rankingMargen(ventas, rango, 5), [ventas, rango])
    const mixRows = useMemo(() => mix(vehicles, ventas, rango, dimension), [vehicles, ventas, rango, dimension])
    const proximos = useMemo(() => extras ? vencimientos({
        vehicles, senales: extras.senales, polizas: extras.polizas, facturas: extras.facturas, tareas: extras.tareas,
    }, now) : [], [vehicles, extras, now])

    const vencidos = proximos.filter(v => v.dias < 0)
    const itvVencidas = vencidos.filter(v => v.tipo === 'itv').length
    const otrosVencidos = vencidos.length - itvVencidas
    const totalSinCoste = vehicles.filter(v => ['vendido', 'disponible', 'reservado'].includes(v.estado) && !(v.precio_compra > 0)).length
    const aproxTotal = ventas.filter(v => v.origenFecha === 'aprox').length

    const diasTone = kpis.diasMedios <= DIAS_STOCK_OK ? 'good' : kpis.diasMedios <= DIAS_STOCK_AVISO ? 'warning' : 'bad'
    const diasToneText = { good: 'buen ritmo', warning: 'vigilar', bad: 'stock lento' }[diasTone]

    // Serie del gráfico de ventas según la métrica elegida
    const serieValor = (s: MesSerie) => metrica === 'unidades' ? s.unidades : metrica === 'margen' ? s.margen : s.ingresos
    const total12 = serie.reduce((sum, s) => sum + serieValor(s), 0)
    const mejorMes = serie.reduce<MesSerie | null>((best, s) => (!best || serieValor(s) > serieValor(best) ? s : best), null)
    const fmtMetrica = (v: number) => metrica === 'unidades' ? plural(v, 'coche', 'coches') : eurFmt(v)
    const fmtEje = (v: number) => metrica === 'unidades' ? numFmt(v) : eurCompact(v)

    // Escala común para mejores y peores: las barras se comparan entre sí
    const rankingScale = {
        pos: Math.max(0, ...[...ranking.mejores, ...ranking.peores].map(v => v.margen ?? 0)),
        neg: Math.max(0, ...[...ranking.mejores, ...ranking.peores].map(v => -(v.margen ?? 0))),
    }

    const hora = now.getHours()
    const saludo = hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'

    return (
        <div className="dash-root mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pb-12 pt-5 sm:px-6 lg:gap-6 lg:px-8 lg:pt-8">
            {/* ============================ CABECERA ============================ */}
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[13px] font-medium text-slate-500">{fechaLarga(now)}</p>
                    <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[30px]">
                        {saludo}. Así va el negocio
                    </h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div role="radiogroup" aria-label="Periodo" className="dash-segmented flex overflow-x-auto">
                        {PERIODOS.map(p => (
                            <button
                                key={p.key}
                                type="button"
                                role="radio"
                                aria-checked={periodo === p.key}
                                onClick={() => onPeriodoChange(p.key)}
                                className={cn("dash-segment flex-1 sm:flex-none", periodo === p.key && "dash-segment-active")}
                            >
                                {p.corto}
                            </button>
                        ))}
                    </div>
                    <Link href="/inventario/nuevo" className="dash-btn dash-btn-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>add</span>
                        Añadir coche
                    </Link>
                </div>
            </header>

            {/* ============================ AVISOS ============================ */}
            {error && (
                <div role="alert" className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <span className="material-symbols-outlined" aria-hidden>cloud_off</span>
                    <p className="flex-1">No se han podido cargar todos los datos. Algunas cifras pueden estar incompletas.</p>
                    <button type="button" onClick={onRetry} className="rounded-lg px-2 py-1 font-bold underline underline-offset-2 hover:bg-red-100">Reintentar</button>
                </div>
            )}

            {(itvVencidas > 0 || otrosVencidos > 0 || kpis.parados > 0) && (
                <div className="-mt-1 flex flex-wrap gap-2">
                    {itvVencidas > 0 && (
                        <AlertChip href="#vencimientos" tone="danger" icon="verified">
                            {plural(itvVencidas, 'coche a la venta con la ITV caducada', 'coches a la venta con la ITV caducada')}
                        </AlertChip>
                    )}
                    {otrosVencidos > 0 && (
                        <AlertChip href="#vencimientos" tone="danger" icon="event_busy">
                            {plural(otrosVencidos, 'plazo vencido', 'plazos vencidos')}
                        </AlertChip>
                    )}
                    {kpis.parados > 0 && (
                        <AlertChip href={`/inventario?estado=disponible&diasMin=${DIAS_RIESGO + 1}&orden=antiguedad`} tone="warning" icon="schedule">
                            {plural(kpis.parados, `coche lleva más de ${DIAS_RIESGO} días sin venderse`, `coches llevan más de ${DIAS_RIESGO} días sin venderse`)}
                        </AlertChip>
                    )}
                </div>
            )}

            {/* ============================ KPIs ============================ */}
            <section aria-label="Cifras clave" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatTile
                    label="Coches vendidos"
                    icon="sell"
                    value={numFmt(kpis.vendidos.actual)}
                    detail={<>{eurFmt(kpis.ingresos.actual)} en ventas</>}
                    spark={{ values: serie.map(s => s.unidades), label: 'Coches vendidos en los últimos 12 meses' }}
                    footer={<Delta value={kpis.vendidos.delta} label={rango.comparacion} />}
                    href="/inventario?estado=vendido"
                />
                <StatTile
                    label="Margen bruto"
                    icon="savings"
                    value={eurFmt(kpis.margen.actual)}
                    detail={kpis.margenMedio !== null
                        ? <>{eurFmt(kpis.margenMedio)} por coche · {pctFmt(kpis.margenPct ?? 0)}</>
                        : <>Sin ventas con coste en el periodo</>}
                    spark={{ values: serie.map(s => s.margen), label: 'Margen bruto en los últimos 12 meses' }}
                    footer={<Delta value={kpis.margen.delta} label={rango.comparacion} />}
                    href="/inventario?estado=vendido"
                />
                <StatTile
                    label="Dinero en stock"
                    icon="account_balance_wallet"
                    badge="Hoy"
                    value={eurFmt(kpis.stockCoste)}
                    detail={<>{plural(kpis.stockUnidades, 'coche', 'coches')} · a la venta por {eurCompact(kpis.stockPvp)}</>}
                    visual={
                        <div className="w-full">
                            <StackedBar
                                height={10}
                                parts={[
                                    { key: 'coste', value: kpis.stockCoste, color: CHART.primary, label: `Coste ${eurFmt(kpis.stockCoste)}` },
                                    { key: 'margen', value: Math.max(0, kpis.stockMargenPotencial), color: '#9dbcf8', label: `Margen ${eurFmt(kpis.stockMargenPotencial)}` },
                                ]}
                            />
                            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                                <span className="flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: CHART.primary }} aria-hidden />Coste</span>
                                <span className="flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: '#9dbcf8' }} aria-hidden />Margen por ganar</span>
                            </div>
                        </div>
                    }
                    footer={
                        <span className={cn("text-xs font-semibold", kpis.stockMargenPotencial < 0 ? "text-red-700" : "text-emerald-700")}>
                            {kpis.stockMargenPotencial < 0 ? '▼' : '▲'} {eurFmt(kpis.stockMargenPotencial)}
                            <span className="font-normal text-slate-500"> si se vende todo a precio</span>
                        </span>
                    }
                    href="/inventario?estado=stock"
                />
                <StatTile
                    label="Días a la venta"
                    icon="hourglass_top"
                    badge="Hoy"
                    value={`${numFmt(kpis.diasMedios)} días`}
                    tone={diasTone}
                    detail={<>Media del stock · <span className="font-semibold text-slate-700">{diasToneText}</span></>}
                    visual={
                        <div className="w-full">
                            <StackedBar
                                height={10}
                                parts={tramos.map((t, i) => ({ key: t.key, value: t.unidades, color: CHART.aging[i], label: `${t.label}: ${t.unidades}` }))}
                            />
                            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                                <span>Recién llegados</span>
                                <span>Más de 120 días</span>
                            </div>
                        </div>
                    }
                    footer={
                        <span className="text-xs text-slate-500">
                            Objetivo: menos de <strong className="font-semibold text-slate-700">{DIAS_STOCK_OK} días</strong>
                        </span>
                    }
                    href="/inventario?estado=stock&orden=antiguedad"
                />
            </section>

            {totalSinCoste > 0 && (
                <Link
                    href="/inventario?sinCoste=1"
                    className="group -mt-1 flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-900 transition-colors hover:bg-amber-50"
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>edit_note</span>
                    </span>
                    <p className="flex-1 leading-snug">
                        <strong className="font-semibold">{plural(totalSinCoste, 'coche sin precio de compra', 'coches sin precio de compra')}.</strong>{' '}
                        Su margen no se puede calcular y no suma en las cifras de margen.
                    </p>
                    <span className="hidden shrink-0 items-center gap-0.5 font-semibold text-amber-800 group-hover:underline sm:inline-flex">
                        Completar
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>arrow_forward</span>
                    </span>
                </Link>
            )}

            {/* ============================ CUERPO ============================ */}
            <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-12">
                {/* Ventas por mes */}
                <Card className="order-2 xl:order-none xl:col-span-8" title="Ventas mes a mes" subtitle="Últimos 12 meses">
                    {ventas.length === 0 ? (
                        <EmptyState icon="bar_chart" title="Aún no hay ventas" text="Cuando marques un coche como vendido aparecerá aquí." />
                    ) : (
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-slate-900 tabular-nums">
                                        {metrica === 'unidades' ? numFmt(total12) : eurFmt(total12)}
                                    </p>
                                    <p className="mt-1.5 text-[13px] text-slate-500">
                                        {metrica === 'unidades' ? 'coches vendidos' : metrica === 'margen' ? 'de margen bruto' : 'en ventas'} en 12 meses
                                        {mejorMes && serieValor(mejorMes) > 0 && (
                                            <> · mejor mes <span className="font-semibold capitalize text-slate-700">{mejorMes.label}</span></>
                                        )}
                                    </p>
                                </div>
                                <div role="tablist" aria-label="Qué mostrar" className="dash-segmented dash-segmented-sm inline-flex">
                                    {METRICAS.map(m => (
                                        <button
                                            key={m.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={metrica === m.key}
                                            onClick={() => setMetrica(m.key)}
                                            className={cn("dash-segment", metrica === m.key && "dash-segment-active")}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ColumnChart
                                ariaLabel={`${METRICAS.find(m => m.key === metrica)!.label} por mes`}
                                data={serie.map((s, i) => ({
                                    key: s.key,
                                    label: s.label,
                                    value: serieValor(s),
                                    tooltip: <MonthTooltip s={s} enCurso={i === serie.length - 1} />,
                                }))}
                                formatAxis={fmtEje}
                                formatValue={fmtMetrica}
                                height={220}
                                partialLast
                            />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-3.5 rounded-sm" style={{ background: `repeating-linear-gradient(135deg, ${CHART.primary} 0 3px, ${CHART.primary}99 3px 5px)` }} aria-hidden />
                                    Mes en curso
                                </span>
                                {aproxTotal > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>info</span>
                                        {plural(aproxTotal, 'venta sin contrato ni factura usa', 'ventas sin contrato ni factura usan')} la fecha de su última modificación
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Antigüedad del stock */}
                <Card className="order-3 xl:order-none xl:col-span-4" title="Tiempo a la venta" subtitle="Coches en stock según los días que llevan" badge="Hoy">
                    {kpis.stockUnidades === 0 ? (
                        <EmptyState icon="garage" title="No hay coches en stock" action={{ label: 'Añadir coche', href: '/inventario/nuevo' }} />
                    ) : (
                        <div className="flex h-full flex-col">
                            <HBars
                                max={Math.max(...tramos.map(t => t.unidades))}
                                data={tramos.map((t, i) => ({
                                    key: t.key,
                                    label: t.label,
                                    value: t.unidades,
                                    valueLabel: numFmt(t.unidades),
                                    sublabel: t.coste > 0 ? eurCompact(t.coste) : '—',
                                    color: CHART.aging[i],
                                    href: `/inventario?estado=stock&diasMin=${t.min}${isFinite(t.max) ? `&diasMax=${t.max}` : ''}&orden=antiguedad`,
                                    marker: t.min > DIAS_RIESGO && t.unidades > 0
                                        ? <span className="rounded-md bg-amber-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-amber-800">Parados</span>
                                        : undefined,
                                }))}
                            />
                            <p className="mt-auto pt-4 text-xs leading-relaxed text-slate-500">
                                Número de coches y lo que costaron (compra, gastos y reparaciones). Pulsa un tramo para verlos.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Coches para rebajar */}
                <Card
                    className="order-1 xl:order-none xl:col-span-8"
                    title="Coches para rebajar"
                    subtitle={`Llevan más de ${DIAS_REBAJA} días a la venta · primero los más antiguos`}
                    action={rebajas.length > 5 ? { label: `Ver los ${rebajas.length}`, href: `/inventario?estado=disponible&diasMin=${DIAS_REBAJA + 1}&orden=antiguedad` } : undefined}
                >
                    {rebajas.length === 0 ? (
                        <EmptyState icon="check_circle" title="Ningún coche parado" text={`Todo el stock lleva menos de ${DIAS_REBAJA} días a la venta.`} />
                    ) : (
                        <RebajarList items={rebajas.slice(0, 5)} />
                    )}
                </Card>

                {/* Vencimientos */}
                <div id="vencimientos" className="order-4 scroll-mt-24 xl:order-none xl:col-span-4">
                    <Card title="Próximos vencimientos" subtitle="ITV, seguros, reservas, cobros y tareas" badge="30 días" className="h-full">
                        {!extras ? (
                            <div className="flex flex-col gap-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
                        ) : proximos.length === 0 ? (
                            <EmptyState icon="event_available" title="Nada pendiente" text="No vence nada en los próximos 30 días." />
                        ) : (
                            <>
                                <VencimientosList items={proximos.slice(0, 6)} />
                                {proximos.length > 6 && (
                                    <p className="mt-2 text-center text-xs text-slate-500">y {plural(proximos.length - 6, 'más', 'más')}</p>
                                )}
                            </>
                        )}
                    </Card>
                </div>

                {/* Margen por coche */}
                <Card
                    className="order-5 xl:order-none xl:col-span-6"
                    title="Margen por coche vendido"
                    subtitle={ranking.peores.length > 0 ? `Los 5 que más y los 5 que menos han dejado · ${periodoLabel}` : `Ventas con coste conocido · ${periodoLabel}`}
                >
                    {ranking.total === 0 ? (
                        <EmptyState
                            icon="savings"
                            title="No hay ventas con coste en este periodo"
                            text={kpis.ventasSinCoste > 0
                                ? `${plural(kpis.ventasSinCoste, 'venta no tiene', 'ventas no tienen')} precio de compra. Prueba con un periodo más largo o complétalo.`
                                : 'Prueba con un periodo más largo.'}
                        />
                    ) : (
                        <div className="flex flex-col gap-2">
                            {ranking.peores.length > 0 && <Divider>Los que más</Divider>}
                            <MarginBars data={ranking.mejores.map(toMarginBar)} scale={rankingScale} />
                            {ranking.peores.length > 0 && (
                                <>
                                    <Divider>Los que menos</Divider>
                                    <MarginBars data={ranking.peores.map(toMarginBar)} scale={rankingScale} />
                                </>
                            )}
                        </div>
                    )}
                </Card>

                {/* Mix */}
                <Card
                    className="order-6 xl:order-none xl:col-span-6"
                    title="Lo que tienes y lo que vendes"
                    subtitle={`¿Tu stock se parece a lo que se vende? · ventas ${periodoLabel}`}
                >
                    <div role="tablist" aria-label="Agrupar por" className="dash-segmented dash-segmented-sm mb-5 inline-flex">
                        {([['marca', 'Marca'], ['combustible', 'Combustible'], ['precio', 'Precio']] as const).map(([k, l]) => (
                            <button
                                key={k}
                                type="button"
                                role="tab"
                                aria-selected={dimension === k}
                                onClick={() => setDimension(k)}
                                className={cn("dash-segment", dimension === k && "dash-segment-active")}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <PairedBars
                        aName="% del stock actual"
                        bName="% de las ventas"
                        data={mixRows.map(r => ({
                            key: r.key,
                            label: r.label,
                            a: r.stockPct,
                            b: r.ventasPct,
                            aLabel: `${Math.round(r.stockPct)} % · ${r.stock}`,
                            bLabel: `${Math.round(r.ventasPct)} % · ${r.ventas}`,
                            href: r.key === '__otras' ? undefined
                                : dimension === 'marca' ? `/inventario?estado=stock&marca=${encodeURIComponent(r.label)}`
                                    : dimension === 'combustible' ? `/inventario?estado=stock&combustible=${encodeURIComponent(r.key)}`
                                        : undefined,
                        }))}
                    />
                </Card>

                {/* Embudo */}
                <Card
                    className="order-7 xl:order-none xl:col-span-4"
                    title="De contacto a venta"
                    subtitle={`Contactos nuevos, reservas y ventas · ${periodoLabel}`}
                    action={{ label: 'Contactos', href: '/contactos' }}
                >
                    {!contactosPeriodo || !extras ? (
                        <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Funnel
                                steps={[
                                    { label: 'Contactos nuevos', value: contactosPeriodo.nuevos, href: '/contactos', icon: 'person_add' },
                                    // Las reservas solo se muestran si se usan: hoy no hay ninguna señal registrada
                                    ...(extras.senales.length > 0
                                        ? [{ label: 'Reservas', value: contactosPeriodo.reservas, href: '/contratos', icon: 'bookmark' }]
                                        : []),
                                    { label: 'Ventas', value: kpis.vendidos.actual, href: '/inventario?estado=vendido', icon: 'handshake' },
                                ]}
                            />
                            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                                <Delta
                                    value={contactosPeriodo.nuevosPrev > 0 ? ((contactosPeriodo.nuevos - contactosPeriodo.nuevosPrev) / contactosPeriodo.nuevosPrev) * 100 : null}
                                    label={`contactos ${rango.comparacion}`}
                                />
                                <Link href="/contactos" className="text-[13px] text-slate-600 hover:text-primary">
                                    <strong className="font-bold tabular-nums text-slate-900">{numFmt(extras.contactos.pendiente)}</strong> contactos pendientes de atender
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Últimas ventas */}
                <Card
                    className="order-8 xl:order-none xl:col-span-8"
                    title="Últimas ventas"
                    action={{ label: 'Ver vendidos', href: '/inventario?estado=vendido' }}
                >
                    {ventas.length === 0 ? (
                        <EmptyState icon="sell" title="Aún no hay ventas" />
                    ) : (
                        <UltimasVentas items={ventas.slice(0, 5)} />
                    )}
                </Card>
            </div>
        </div>
    )
}

// ============================================================================
// PIEZAS
// ============================================================================

function toMarginBar(v: Venta) {
    const margen = v.margen ?? 0
    return {
        key: v.vehicle.id,
        label: nombreCoche(v.vehicle),
        sublabel: `Vendido por ${eurFmt(v.precio)}${v.precio > 0 ? ` · ${pctFmt((margen / v.precio) * 100)}` : ''}`,
        value: margen,
        valueLabel: `${margen > 0 ? '+' : ''}${eurFmt(margen)}`,
        href: `/inventario/${v.vehicle.id}`,
    }
}

function MonthTooltip({ s, enCurso }: { s: MesSerie; enCurso: boolean }) {
    return (
        <TooltipBox
            title={`${s.label.charAt(0).toUpperCase()}${s.label.slice(1)}${enCurso ? ' · en curso' : ''}`}
            rows={[
                { label: 'Coches vendidos', value: numFmt(s.unidades), strong: true },
                { label: 'Ingresos', value: eurFmt(s.ingresos) },
                { label: 'Margen', value: eurFmt(s.margen) },
            ]}
            note={s.aproximadas > 0 ? `${plural(s.aproximadas, 'venta con fecha aproximada', 'ventas con fecha aproximada')}` : undefined}
        />
    )
}

function Divider({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center gap-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {children}
            <span className="h-px flex-1 bg-slate-100" />
        </div>
    )
}

function AlertChip({ href, tone, icon, children }: { href: string; tone: 'danger' | 'warning'; icon: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex min-h-[36px] items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-3 text-[13px] font-medium transition-colors",
                tone === 'danger' ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100" : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
            )}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }} aria-hidden>{icon}</span>
            {children}
            <span className="material-symbols-outlined -mr-1 opacity-60" style={{ fontSize: 16 }} aria-hidden>chevron_right</span>
        </Link>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pb-12 pt-5 sm:px-6 lg:gap-6 lg:px-8 lg:pt-8" aria-busy="true" aria-label="Cargando el panel">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-8 w-72" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-[214px] rounded-[1.25rem]" />)}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-12">
                <Skeleton className="h-[420px] rounded-[1.25rem] xl:col-span-8" />
                <Skeleton className="h-[420px] rounded-[1.25rem] xl:col-span-4" />
            </div>
        </div>
    )
}
