"use client"

import { useState, useRef, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"

interface DocumentScannerModalProps {
    open: boolean
    onClose: () => void
    onDocumentsScanned?: (documents: ScannedDocument[]) => void
    vehicleId?: string
}

export interface ScannedDocument {
    id: string
    name: string
    type: 'ficha_tecnica' | 'permiso_circulacion' | 'compra_venta' | 'otro'
    imageData: string
    createdAt: Date
}

const DOCUMENT_TYPES = [
    { value: 'ficha_tecnica', label: 'Ficha Técnica', icon: 'description' },
    { value: 'permiso_circulacion', label: 'Permiso Circulación', icon: 'badge' },
    { value: 'compra_venta', label: 'Contrato Compra-Venta', icon: 'handshake' },
    { value: 'otro', label: 'Otro documento', icon: 'draft' },
]

export function DocumentScannerModal({ open, onClose, onDocumentsScanned, vehicleId }: DocumentScannerModalProps) {
    const { addToast } = useToast()
    const [mode, setMode] = useState<'camera' | 'upload'>('upload')
    const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([])
    const [selectedType, setSelectedType] = useState<ScannedDocument['type']>('ficha_tecnica')
    const [isProcessing, setIsProcessing] = useState(false)
    const [cameraActive, setCameraActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsProcessing(true)
        const newDocs: ScannedDocument[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') continue

            const imageData = await readFileAsDataURL(file)
            newDocs.push({
                id: `doc-${Date.now()}-${i}`,
                name: file.name,
                type: selectedType,
                imageData,
                createdAt: new Date()
            })
        }

        setScannedDocs(prev => [...prev, ...newDocs])
        setIsProcessing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setCameraActive(true)
        } catch (err) {
            console.error('Camera access error:', err)
            addToast('No se pudo acceder a la cámara. Por favor, sube el documento manualmente.', 'warning')
            setMode('upload')
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setCameraActive(false)
    }

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.9)

        const newDoc: ScannedDocument = {
            id: `doc-${Date.now()}`,
            name: `Escaneo_${new Date().toISOString().split('T')[0]}.jpg`,
            type: selectedType,
            imageData,
            createdAt: new Date()
        }

        setScannedDocs(prev => [...prev, newDoc])
    }, [selectedType])

    const removeDocument = (id: string) => {
        setScannedDocs(prev => prev.filter(doc => doc.id !== id))
    }

    const handleSave = () => {
        if (onDocumentsScanned && scannedDocs.length > 0) {
            onDocumentsScanned(scannedDocs)
        }
        setScannedDocs([])
        stopCamera()
        onClose()
    }

    const handleClose = () => {
        setScannedDocs([])
        stopCamera()
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden p-0 bg-[#f2f2f7] dark:bg-background-dark rounded-2xl">
                <VisuallyHidden.Root>
                    <DialogTitle>Escáner de Documentos</DialogTitle>
                </VisuallyHidden.Root>

                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-[#1c1c1e] p-4 border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={handleClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-blue-500 text-2xl">close</span>
                    </button>
                    <h2 className="text-lg font-bold">Escanear Documento</h2>
                    <button
                        onClick={handleSave}
                        disabled={scannedDocs.length === 0}
                        className={cn(
                            "text-sm font-bold px-3 py-1.5 rounded-lg transition-colors",
                            scannedDocs.length > 0
                                ? "text-blue-500 hover:bg-blue-50"
                                : "text-gray-400 cursor-not-allowed"
                        )}
                    >
                        Guardar
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Mode Selector */}
                    <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                        <button
                            onClick={() => { setMode('upload'); stopCamera() }}
                            className={cn(
                                "flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                mode === 'upload'
                                    ? "bg-white dark:bg-gray-700 text-blue-500 shadow-sm"
                                    : "text-gray-500"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">upload_file</span>
                            Subir archivo
                        </button>
                        <button
                            onClick={() => { setMode('camera'); startCamera() }}
                            className={cn(
                                "flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                                mode === 'camera'
                                    ? "bg-white dark:bg-gray-700 text-blue-500 shadow-sm"
                                    : "text-gray-500"
                            )}
                        >
                            <span className="material-symbols-outlined text-lg">photo_camera</span>
                            Cámara
                        </button>
                    </div>

                    {/* Document Type Selector */}
                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                            Tipo de documento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DOCUMENT_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setSelectedType(type.value as ScannedDocument['type'])}
                                    className={cn(
                                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                                        selectedType === type.value
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c1e]"
                                    )}
                                >
                                    <span className={cn(
                                        "material-symbols-outlined text-xl",
                                        selectedType === type.value ? "text-blue-500" : "text-gray-400"
                                    )}>
                                        {type.icon}
                                    </span>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        selectedType === type.value ? "text-blue-500" : "text-gray-700 dark:text-gray-300"
                                    )}>
                                        {type.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upload Mode */}
                    {mode === 'upload' && (
                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="material-symbols-outlined text-3xl text-blue-500 animate-spin">progress_activity</span>
                                        <span className="text-sm text-gray-500">Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-3xl text-gray-400">cloud_upload</span>
                                        <span className="text-sm text-gray-500">Pulsa para seleccionar archivos</span>
                                        <span className="text-xs text-gray-400">JPG, PNG o PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Camera Mode */}
                    {mode === 'camera' && (
                        <div className="space-y-4">
                            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {/* Document frame overlay */}
                                <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none" />
                                {/* Corners */}
                                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <button
                                onClick={capturePhoto}
                                disabled={!cameraActive}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">photo_camera</span>
                                Capturar documento
                            </button>
                        </div>
                    )}

                    {/* Scanned Documents List */}
                    {scannedDocs.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-500">
                                Documentos escaneados ({scannedDocs.length})
                            </h4>
                            <div className="space-y-2">
                                {scannedDocs.map(doc => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                            {doc.imageData.startsWith('data:image') ? (
                                                <img
                                                    src={doc.imageData}
                                                    alt={doc.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-gray-400">picture_as_pdf</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{doc.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeDocument(doc.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
