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
    /** Matrículas (normalizadas) de vehículos VENDIDOS: pólizas que conviene dar de baja */
    soldPlates?: string[]
}

export function ImportPreviewModal({
    open,
    onClose,
    result,
    onConfirm,
    isImporting,
    assignableVehicles = [],
    onAssignVehicle,
    soldPlates = []
}: ImportPreviewModalProps) {
    // Fila de "sin coincidencia" con el buscador de vehículo desplegado
    const [openAssignRow, setOpenAssignRow] = useState<number | null>(null)
    const [assignSearch, setAssignSearch] = useState("")

    if (!result) return null

    const soldSet = new Set(soldPlates)

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

    const handleToggleAssign = (policy: ParsedPolicy, idx: number) => {
        if (openAssignRow === idx) {
            setOpenAssignRow(null)
            setAssignSearch("")
            return
        }
        // Prefiltrar el buscador con la marca que trae el archivo de la
        // aseguradora: el usuario ve directamente los candidatos de esa marca
        setAssignSearch(policy.marcaModelo ? policy.marcaModelo.split(/\s+/)[0] : "")
        setOpenAssignRow(idx)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* !flex fuerza layout de columna sobre el grid del DialogContent
                base: cabecera fija, cuerpo con scroll y pie de acciones
                siempre visible */}
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden !flex !flex-col">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-[#135bec]" />
                        Resultado de Importación de Pólizas
                    </DialogTitle>
                    <p className="text-xs text-slate-500 mt-1">
                        Revisa los datos antes de confirmar la importación
                    </p>
                </DialogHeader>

                {/* Cuerpo con scroll único */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Stats Cards */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                            <p className="text-xl font-bold text-slate-900">{result.totalPolicies}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pólizas en archivo</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                            <p className="text-xl font-bold text-emerald-600">{result.matched.length}</p>
                            <p className="text-[10px] text-emerald-600/80 uppercase tracking-wider">Coincidencias</p>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                            <p className="text-xl font-bold text-amber-600">{result.unmatched.length}</p>
                            <p className="text-[10px] text-amber-600/80 uppercase tracking-wider">Sin vehículo</p>
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                            <p className="text-xl font-bold text-red-500">{result.vehiclesWithoutPolicy.length}</p>
                            <p className="text-[10px] text-red-500/80 uppercase tracking-wider">Sin póliza</p>
                        </div>
                    </div>

                    {/* Matched Table */}
                    <div className="px-6 pb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Vehículos que serán actualizados ({result.matched.length})
                        </h3>
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="text-xs">Vehículo</TableHead>
                                        <TableHead className="text-xs">Matrícula</TableHead>
                                        <TableHead className="text-xs">Nº Póliza</TableHead>
                                        <TableHead className="text-xs">Vencimiento</TableHead>
                                        <TableHead className="text-xs">Tipo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.matched.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="text-xs text-slate-700 font-medium">{item.vehicleName}</TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600">{item.matricula}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{item.policy.numeroPoliza}</TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {item.policy.fechaVencimiento ? formatDate(item.policy.fechaVencimiento) : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">{item.policy.tipoPoliza || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {result.matched.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-xs text-slate-400 py-8">
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
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Matrículas aseguradas sin vehículo coincidente ({result.unmatched.length})
                            </h3>
                            <p className="text-xs text-slate-500 mb-3">
                                Estas matrículas están en el seguro pero no constan en el inventario. Dos causas habituales:
                                el vehículo está en el CRM con una referencia web (WEB-…) en vez de su matrícula real —
                                asígnalo con el buscador y la matrícula quedará guardada en su ficha — o el vehículo ya se
                                vendió o no está en stock, en cuyo caso conviene valorar dar de baja esa póliza.
                            </p>
                            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                                {result.unmatched.map((policy, idx) => {
                                    const isSold = soldSet.has(policy.matricula)
                                    return (
                                        <div key={`${policy.matricula}-${idx}`} className="p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-sm font-mono font-semibold text-slate-800 shrink-0">{policy.matricula}</span>
                                                    {policy.marcaModelo && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase shrink-0">
                                                            {policy.marcaModelo}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 truncate hidden sm:inline">{policy.numeroPoliza}</span>
                                                </div>
                                                {isSold ? (
                                                    <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 uppercase">
                                                        Vendido — valorar baja del seguro
                                                    </span>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleAssign(policy, idx)}
                                                        className="shrink-0 text-xs h-8"
                                                    >
                                                        {openAssignRow === idx ? (
                                                            <>
                                                                <X className="h-3 w-3 mr-1.5" />
                                                                Cerrar
                                                            </>
                                                        ) : (
                                                            'Asignar a vehículo…'
                                                        )}
                                                    </Button>
                                                )}
                                            </div>

                                            {openAssignRow === idx && !isSold && (
                                                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                                                    <div className="relative mb-2">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <input
                                                            autoFocus
                                                            value={assignSearch}
                                                            onChange={(e) => setAssignSearch(e.target.value)}
                                                            placeholder="Buscar por marca, modelo o matrícula…"
                                                            className="w-full h-9 pl-8 pr-3 text-xs rounded-md bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#135bec]"
                                                        />
                                                    </div>
                                                    <div className="max-h-44 overflow-y-auto space-y-1">
                                                        {filteredAssignables.slice(0, 50).map(v => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => handleAssign(policy, v.id)}
                                                                className="w-full text-left px-2.5 py-2 rounded-md text-xs text-slate-700 bg-white border border-slate-100 hover:border-[#135bec] hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                                                            >
                                                                <span className="truncate font-medium">{v.marca} {v.modelo}</span>
                                                                <span className="font-mono text-slate-400 shrink-0">{v.matricula}</span>
                                                            </button>
                                                        ))}
                                                        {filteredAssignables.length === 0 && (
                                                            <p className="text-center text-xs text-slate-400 py-3">
                                                                Ningún vehículo disponible con esa búsqueda
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {result.vehiclesWithoutPolicy.length > 0 && (
                        <div className="px-6 pb-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Vehículos en stock SIN póliza en el archivo:
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {result.vehiclesWithoutPolicy.slice(0, 24).map((mat, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-50 text-red-600 border border-red-100">
                                        {mat}
                                    </span>
                                ))}
                                {result.vehiclesWithoutPolicy.length > 24 && (
                                    <span className="text-[10px] text-red-400">
                                        +{result.vehiclesWithoutPolicy.length - 24} más
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions - pie fijo, siempre visible */}
                <div className="p-4 px-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
                    <Button variant="outline" onClick={onClose} disabled={isImporting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isImporting || result.matched.length === 0}
                        className="bg-[#135bec] hover:bg-[#0f4fd6] text-white"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar Importación ({result.matched.length})
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
