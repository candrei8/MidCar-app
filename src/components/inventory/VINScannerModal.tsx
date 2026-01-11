"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import { decodeVINFull, validateVIN, type VINDecodedInfo } from "@/lib/vin-decoder"

interface VINScannerModalProps {
    open: boolean
    onClose: () => void
    onVINDetected?: (vin: string, info?: VINDecodedInfo) => void
}

export function VINScannerModal({ open, onClose, onVINDetected }: VINScannerModalProps) {
    const [manualVIN, setManualVIN] = useState('')
    const [isValidVIN, setIsValidVIN] = useState<boolean | null>(null)
    const [isDecoding, setIsDecoding] = useState(false)
    const [decodedInfo, setDecodedInfo] = useState<VINDecodedInfo | null>(null)

    const handleManualVINChange = (value: string) => {
        const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '').slice(0, 17)
        setManualVIN(cleaned)
        setDecodedInfo(null)

        if (cleaned.length === 17) {
            setIsValidVIN(validateVIN(cleaned))
        } else {
            setIsValidVIN(null)
        }
    }

    // Decode VIN when valid
    useEffect(() => {
        if (isValidVIN && manualVIN.length === 17) {
            setIsDecoding(true)
            decodeVINFull(manualVIN)
                .then(info => {
                    setDecodedInfo(info)
                    setIsDecoding(false)
                })
                .catch(() => {
                    setIsDecoding(false)
                })
        }
    }, [isValidVIN, manualVIN])

    const handleSubmitVIN = () => {
        if (isValidVIN && onVINDetected) {
            onVINDetected(manualVIN, decodedInfo || undefined)
            onClose()
        }
    }

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setManualVIN('')
            setIsValidVIN(null)
            setDecodedInfo(null)
            setIsDecoding(false)
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden p-0 bg-[#f2f2f7] dark:bg-background-dark rounded-2xl">
                <VisuallyHidden.Root>
                    <DialogTitle>Escáner VIN</DialogTitle>
                </VisuallyHidden.Root>

                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-[#1c1c1e] p-4 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-blue-500 text-2xl">close</span>
                    </button>
                    <h2 className="text-lg font-bold">Introducir VIN</h2>
                    <div className="w-10" />
                </div>

                <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium">¿Dónde encontrar el VIN?</p>
                            <p className="text-blue-600 dark:text-blue-400 mt-1">
                                En el parabrisas (esquina inferior izquierda), en el marco de la puerta del conductor, o en el compartimento del motor.
                            </p>
                        </div>
                    </div>

                    {/* VIN Input */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Número VIN (17 caracteres)
                        </label>
                        <input
                            type="text"
                            value={manualVIN}
                            onChange={(e) => handleManualVINChange(e.target.value)}
                            placeholder="WVWZZZ3CZWE123456"
                            autoComplete="off"
                            autoCapitalize="characters"
                            autoFocus
                            className={cn(
                                "w-full px-4 py-4 rounded-xl border-2 text-lg font-mono tracking-widest uppercase bg-white dark:bg-[#1c1c1e] transition-all",
                                isValidVIN === true && "border-green-500 focus:border-green-500 bg-green-50 dark:bg-green-900/20",
                                isValidVIN === false && "border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/20",
                                isValidVIN === null && "border-gray-200 dark:border-gray-700 focus:border-blue-500"
                            )}
                        />
                        <div className="flex justify-between mt-2">
                            <span className={cn(
                                "text-sm font-medium",
                                manualVIN.length === 17 ? "text-green-600" : "text-gray-400"
                            )}>
                                {manualVIN.length}/17 caracteres
                            </span>
                            {isValidVIN === true && (
                                <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    VIN válido
                                </span>
                            )}
                            {isValidVIN === false && (
                                <span className="text-sm text-red-500 flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    VIN no válido
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Loading State */}
                    {isDecoding && (
                        <div className="flex items-center justify-center gap-3 py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                            <span className="text-sm text-gray-500">Consultando base de datos...</span>
                        </div>
                    )}

                    {/* Decoded VIN Info */}
                    {decodedInfo && !isDecoding && (
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 border border-gray-200 dark:border-gray-700 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-base">verified</span>
                                Información del vehículo (NHTSA)
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Make */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block">Marca</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {decodedInfo.make || decodedInfo.manufacturer || '-'}
                                    </span>
                                </div>

                                {/* Model */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block">Modelo</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {decodedInfo.model || '-'}
                                    </span>
                                </div>

                                {/* Year */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block">Año</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {decodedInfo.year || '-'}
                                    </span>
                                </div>

                                {/* Body Class */}
                                {decodedInfo.bodyClass && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block">Carrocería</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.bodyClass}
                                        </span>
                                    </div>
                                )}

                                {/* Fuel Type */}
                                {decodedInfo.fuelType && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block">Combustible</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.fuelType}
                                        </span>
                                    </div>
                                )}

                                {/* Engine */}
                                {(decodedInfo.engineDisplacement || decodedInfo.engineCylinders) && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block">Motor</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.engineDisplacement ? `${decodedInfo.engineDisplacement}L` : ''}
                                            {decodedInfo.engineCylinders ? ` ${decodedInfo.engineCylinders} cil.` : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Transmission */}
                                {decodedInfo.transmission && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block">Transmisión</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.transmission}
                                        </span>
                                    </div>
                                )}

                                {/* Drive Type */}
                                {decodedInfo.driveType && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                        <span className="text-xs text-gray-500 block">Tracción</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.driveType}
                                        </span>
                                    </div>
                                )}

                                {/* Plant Country */}
                                {decodedInfo.plantCountry && (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 col-span-2">
                                        <span className="text-xs text-gray-500 block">Fabricado en</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {decodedInfo.plantCity ? `${decodedInfo.plantCity}, ` : ''}
                                            {decodedInfo.plantCountry}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* API Source Note */}
                            <p className="text-[10px] text-gray-400 mt-3 text-center">
                                Datos de NHTSA (National Highway Traffic Safety Administration)
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmitVIN}
                        disabled={!isValidVIN || isDecoding}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                            isValidVIN && !isDecoding
                                ? "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                                : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                        )}
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Añadir vehículo con este VIN
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
