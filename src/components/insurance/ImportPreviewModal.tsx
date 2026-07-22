"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ShieldCheck, AlertTriangle, FileSpreadsheet, Check, Loader2, Search, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Vehicle } from "@/types"

export interface ParsedPolicy {
    numeroPoliza: string
    matricula: string
    marcaModelo?: string
    fechaAlta: string | null
    fechaVencimiento: string | null
    tipoPoliza?: string
    prima?: number
    aseguradora?: string
    /** true si el número de póliza es un placeholder generado (el archivo no lo traía) */
    numeroPolizaGenerado?: boolean
}

export interface MatchedPolicy {
    policy: ParsedPolicy
    vehicleId: string
    vehicleName: string
    matricula: string
}

export interface ImportResult {
    totalPolicies: number
    matched: MatchedPolicy[]
    unmatched: ParsedPolicy[]
    vehiclesWithoutPolicy: string[]
}

interface ImportPreviewModalProps {
    open: boolean
    onClose: () => void
    result: ImportResult | null
    onConfirm: () => void
    isImporting: boolean
    /** Vehículos del stock aún sin póliza en esta importación (para asignación manual) */
    assignableVehicles?: Vehicle[]
    /** Vincula manualmente una póliza sin coincidencia a un vehículo */
    onAssignVehicle?: (policy: ParsedPolicy, vehicleId: string) => void
}

export function ImportPreviewModal({
    open,
    onClose,
    result,
    onConfirm,
    isImporting,
    assignableVehicles = [],
    onAssignVehicle
}: ImportPreviewModalProps) {
    // Fila de "sin coincidencia" con el buscador de vehículo desplegado
    const [openAssignRow, setOpenAssignRow] = useState<number | null>(null)
    const [assignSearch, setAssignSearch] = useState("")

    if (!result) return null

    const filteredAssignables = assignableVehicles.filter(v => {
        if (!assignSearch) return true
        const q = assignSearch.toLowerCase()
        return (
            v.marca.toLowerCase().includes(q) ||
            v.modelo.toLowerCase().includes(q) ||
            v.matricula.toLowerCase().includes(q)
        )
    })

    const handleAssign = (policy: ParsedPolicy, vehicleId: string) => {
        onAssignVehicle?.(policy, vehicleId)
        setOpenAssignRow(null)
        setAssignSearch("")
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* !flex fuerza layout de columna sobre el grid del DialogContent
                base: cabecera fija, cuerpo con scroll y pie de acciones
                siempre visible (antes el botón de confirmar quedaba cortado
                sin posibilidad de scroll con listados grandes) */}
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden glass border-white/[0.06] !flex !flex-col">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04] shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Resultado de Importación de Pólizas
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Revisa los datos antes de confirmar la importación
                    </p>
                </DialogHeader>

                {/* Cuerpo con scroll único */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Stats Cards */}
                    <div className="p-6 grid grid-cols-4 gap-3">
                        <div className="card-luxury p-3 text-center">
                            <p className="text-xl font-bold text-white/90">{result.totalPolicies}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">Pólizas en archivo</p>
                        </div>
                        <div className="card-luxury p-3 text-center border-green-500/20 bg-green-500/5">
                            <p className="text-xl font-bold text-green-400">{result.matched.length}</p>
                            <p className="text-[10px] text-green-400/60 uppercase tracking-wider">Coincidencias</p>
                        </div>
                        <div className="card-luxury p-3 text-center border-yellow-500/20 bg-yellow-500/5">
                            <p className="text-xl font-bold text-yellow-400">{result.unmatched.length}</p>
                            <p className="text-[10px] text-yellow-400/60 uppercase tracking-wider">Sin vehículo</p>
                        </div>
                        <div className="card-luxury p-3 text-center border-red-500/20 bg-red-500/5">
                            <p className="text-xl font-bold text-red-400">{result.vehiclesWithoutPolicy.length}</p>
                            <p className="text-[10px] text-red-400/60 uppercase tracking-wider">Sin póliza</p>
                        </div>
                    </div>

                    {/* Matched Table */}
                    <div className="px-6 pb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                            Vehículos que serán actualizados ({result.matched.length})
                        </h3>
                        <div className="card-luxury">
                            <Table className="table-luxury">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Matrícula</TableHead>
                                        <TableHead>Nº Póliza</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead>Tipo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.matched.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="text-xs text-white/70">{item.vehicleName}</TableCell>
                                            <TableCell className="text-xs font-mono text-white/50">{item.matricula}</TableCell>
                                            <TableCell className="text-xs text-white/50">{item.policy.numeroPoliza}</TableCell>
                                            <TableCell className="text-xs text-white/50">
                                                {item.policy.fechaVencimiento ? formatDate(item.policy.fechaVencimiento) : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs text-white/50">{item.policy.tipoPoliza || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {result.matched.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-xs text-white/30 py-8">
                                                No se encontraron coincidencias
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pólizas sin coincidencia: asignación manual a vehículo */}
                    {result.unmatched.length > 0 && onAssignVehicle && (
                        <div className="px-6 pb-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400/60 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Matrículas aseguradas sin vehículo coincidente ({result.unmatched.length})
                            </h3>
                            <p className="text-[10px] text-white/40 mb-3">
                                Suele ocurrir cuando el vehículo está en el CRM con una referencia web (WEB-…) en vez de su
                                matrícula real. Asigna el vehículo correcto: la matrícula real se guardará también en su ficha.
                            </p>
                            <div className="card-luxury divide-y divide-white/[0.04]">
                                {result.unmatched.map((policy, idx) => (
                                    <div key={`${policy.matricula}-${idx}`} className="p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className="text-xs font-mono text-white/70 shrink-0">{policy.matricula}</span>
                                                <span className="text-xs text-white/40 truncate">{policy.numeroPoliza}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAssignSearch("")
                                                    setOpenAssignRow(openAssignRow === idx ? null : idx)
                                                }}
                                                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/70 hover:bg-white/[0.06] flex items-center gap-1.5"
                                            >
                                                {openAssignRow === idx ? (
                                                    <>
                                                        <X className="h-3 w-3" />
                                                        Cerrar
                                                    </>
                                                ) : (
                                                    'Asignar a vehículo…'
                                                )}
                                            </button>
                                        </div>

                                        {openAssignRow === idx && (
                                            <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                                                    <input
                                                        autoFocus
                                                        value={assignSearch}
                                                        onChange={(e) => setAssignSearch(e.target.value)}
                                                        placeholder="Buscar por marca, modelo o matrícula…"
                                                        className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>
                                                <div className="max-h-44 overflow-y-auto space-y-1">
                                                    {filteredAssignables.slice(0, 50).map(v => (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() => handleAssign(policy, v.id)}
                                                            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:bg-primary/20 hover:text-white flex items-center justify-between gap-2"
                                                        >
                                                            <span className="truncate">{v.marca} {v.modelo}</span>
                                                            <span className="font-mono text-white/40 shrink-0">{v.matricula}</span>
                                                        </button>
                                                    ))}
                                                    {filteredAssignables.length === 0 && (
                                                        <p className="text-center text-[11px] text-white/30 py-3">
                                                            Ningún vehículo disponible con esa búsqueda
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {result.vehiclesWithoutPolicy.length > 0 && (
                        <div className="px-6 pb-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400/60 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Vehículos en stock SIN póliza en el archivo:
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {result.vehiclesWithoutPolicy.slice(0, 24).map((mat, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-500/10 text-yellow-400/80">
                                        {mat}
                                    </span>
                                ))}
                                {result.vehiclesWithoutPolicy.length > 24 && (
                                    <span className="text-[10px] text-yellow-400/60">
                                        +{result.vehiclesWithoutPolicy.length - 24} más
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions - pie fijo, siempre visible */}
                <div className="p-4 px-6 border-t border-white/[0.04] flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isImporting} className="text-xs">
                        Cancelar
                    </Button>
                    <button
                        onClick={onConfirm}
                        disabled={isImporting || result.matched.length === 0}
                        className="btn-luxury text-xs flex items-center gap-2 disabled:opacity-40"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                Confirmar Importación ({result.matched.length})
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
