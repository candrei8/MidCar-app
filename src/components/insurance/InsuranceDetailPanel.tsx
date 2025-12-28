"use client"

import { PolizaSeguro, Vehicle, INSURANCE_STATE_CONFIG, POLICY_TYPES } from "@/types"
import { COVERAGE_LABELS, getDaysRemaining } from "@/lib/mock-insurance"
import {
    Shield,
    Calendar,
    Euro,
    FileText,
    Download,
    Edit,
    RefreshCw,
    Trash2,
    X,
    Check,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatDate, formatCurrency } from "@/lib/utils"

interface InsuranceDetailPanelProps {
    vehicle: Vehicle
    policy: PolizaSeguro
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
}

export function InsuranceDetailPanel({
    vehicle,
    policy,
    onClose,
    onEdit,
    onDelete,
}: InsuranceDetailPanelProps) {
    const daysRemaining = getDaysRemaining(policy.fechaVencimiento)
    const stateConfig = INSURANCE_STATE_CONFIG[policy.estado]
    const policyTypeLabel = POLICY_TYPES.find(t => t.value === policy.tipoPoliza)?.label || policy.tipoPoliza

    // Progress percentage (max 365 days = 100%)
    const progressPercent = Math.max(0, Math.min(100, (daysRemaining / 365) * 100))

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] glass border-l border-white/[0.04] z-50 animate-in overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/[0.04] p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Detalle de Póliza
                            </span>
                        </div>
                        <h2 className="text-sm font-semibold text-white/90">
                            {vehicle.marca} {vehicle.modelo}
                        </h2>
                        <p className="text-xs text-white/40 font-mono">{vehicle.matricula}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
                    >
                        <X className="h-4 w-4 text-white/40" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-5">
                {/* Status Badge */}
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${stateConfig.color}15`,
                        color: stateConfig.color,
                    }}
                >
                    {policy.estado === 'asegurado' && <Check className="h-3.5 w-3.5" />}
                    {policy.estado === 'por_vencer' && <Clock className="h-3.5 w-3.5" />}
                    {stateConfig.label}
                </div>

                {/* Policy Info */}
                <div className="card-luxury p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Información de la Póliza
                    </h3>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Compañía</span>
                            <span className="text-xs text-white/80 font-medium">{policy.companiaAseguradora}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Nº Póliza</span>
                            <span className="text-xs text-white/80 font-mono">{policy.numeroPoliza}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Tipo</span>
                            <span className="text-xs text-white/80">{policyTypeLabel}</span>
                        </div>
                        {policy.franquicia && (
                            <div className="flex justify-between">
                                <span className="text-xs text-white/40">Franquicia</span>
                                <span className="text-xs text-white/80">{formatCurrency(policy.franquicia)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="card-luxury p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Vigencia
                    </h3>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Alta</span>
                            <span className="text-xs text-white/80">{formatDate(policy.fechaAlta)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Vencimiento</span>
                            <span className="text-xs text-white/80">{formatDate(policy.fechaVencimiento)}</span>
                        </div>
                    </div>

                    {/* Days remaining progress */}
                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-white/40">Días restantes</span>
                            <span className={cn(
                                "font-medium",
                                daysRemaining <= 30 ? "text-yellow-400" : daysRemaining < 0 ? "text-red-400" : "text-green-400"
                            )}>
                                {daysRemaining < 0 ? `Vencido hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días`}
                            </span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    daysRemaining <= 30 ? "bg-yellow-500" : daysRemaining < 0 ? "bg-red-500" : "bg-green-500"
                                )}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Costs */}
                <div className="card-luxury p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                        <Euro className="h-3.5 w-3.5" />
                        Costes
                    </h3>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Prima anual</span>
                            <span className="text-sm text-white/90 font-medium">{formatCurrency(policy.primaAnual)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-white/40">Prima mensual</span>
                            <span className="text-xs text-white/60">{formatCurrency(policy.primaAnual / 12)}</span>
                        </div>
                    </div>
                </div>

                {/* Coverages */}
                <div className="card-luxury p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        Coberturas
                    </h3>

                    <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(COVERAGE_LABELS).map(([key, label]) => {
                            const isIncluded = policy.coberturas[key as keyof typeof policy.coberturas]
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    {isIncluded ? (
                                        <Check className="h-3.5 w-3.5 text-green-400" />
                                    ) : (
                                        <X className="h-3.5 w-3.5 text-white/20" />
                                    )}
                                    <span className={cn(
                                        "text-xs",
                                        isIncluded ? "text-white/70" : "text-white/30"
                                    )}>
                                        {label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Documents */}
                {(policy.documentos.polizaPdf || policy.documentos.reciboPdf) && (
                    <div className="card-luxury p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Documentos
                        </h3>

                        <div className="space-y-2">
                            {policy.documentos.polizaPdf && (
                                <div className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-white/30" />
                                        <span className="text-xs text-white/60">Póliza.pdf</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/[0.04]">
                                        <Download className="h-3.5 w-3.5 text-white/40" />
                                    </Button>
                                </div>
                            )}
                            {policy.documentos.reciboPdf && (
                                <div className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-white/30" />
                                        <span className="text-xs text-white/60">Recibo.pdf</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/[0.04]">
                                        <Download className="h-3.5 w-3.5 text-white/40" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/[0.04] p-4">
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="btn-ghost-luxury flex-1 flex items-center justify-center gap-1.5 text-xs"
                    >
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                    </button>
                    <button
                        className="btn-ghost-luxury flex-1 flex items-center justify-center gap-1.5 text-xs"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Renovar
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-md hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
