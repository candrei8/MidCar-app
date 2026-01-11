"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, FileSpreadsheet, Image as ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadedFile {
    name: string
    type: string
    size: number
    dataUrl: string
    file: File
}

interface FileUploadZoneProps {
    onFileUploaded: (file: UploadedFile) => void
    onFileParsed?: (data: any) => void
    accept?: Record<string, string[]>
    label?: string
    description?: string
    uploadedFile?: UploadedFile | null
    onRemove?: () => void
    isProcessing?: boolean
    compact?: boolean
    className?: string
}

const DEFAULT_ACCEPT = {
    'application/pdf': ['.pdf'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
}

export function FileUploadZone({
    onFileUploaded,
    onFileParsed,
    accept = DEFAULT_ACCEPT,
    label = "Subir Documento",
    description = "Arrastra o selecciona un archivo PDF, Excel o imagen",
    uploadedFile,
    onRemove,
    isProcessing = false,
    compact = false,
    className
}: FileUploadZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        // Read file as data URL
        const reader = new FileReader()
        reader.onload = () => {
            const uploadedFile: UploadedFile = {
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: reader.result as string,
                file: file
            }
            onFileUploaded(uploadedFile)
        }
        reader.readAsDataURL(file)
    }, [onFileUploaded])

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        noClick: !!uploadedFile,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
    })

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-400" />
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-5 w-5 text-green-400" />
        if (type.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-400" />
        return <FileText className="h-5 w-5 text-white/40" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // Uploaded file preview
    if (uploadedFile && !isProcessing) {
        return (
            <div className={cn(
                "relative flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]",
                className
            )}>
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    {getFileIcon(uploadedFile.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">{uploadedFile.name}</p>
                    <p className="text-[10px] text-white/40">{formatFileSize(uploadedFile.size)}</p>
                </div>
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        className="p-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
                    >
                        <X className="h-4 w-4 text-white/40 hover:text-white/60" />
                    </button>
                )}
            </div>
        )
    }

    // Processing state
    if (isProcessing) {
        return (
            <div className={cn(
                "flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5",
                compact ? "p-3" : "p-6",
                className
            )}>
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-xs text-primary/80">Procesando archivo...</span>
            </div>
        )
    }

    // Drop zone
    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative rounded-lg border-2 border-dashed transition-all cursor-pointer",
                isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-white/10 hover:border-white/20 bg-white/[0.02]",
                compact ? "p-3" : "p-4",
                className
            )}
        >
            <input {...getInputProps()} />
            <div className={cn(
                "flex items-center gap-3",
                compact ? "flex-row" : "flex-col text-center"
            )}>
                <div className={cn(
                    "rounded-full flex items-center justify-center transition-transform",
                    isDragActive ? "scale-110 bg-primary/20" : "bg-white/[0.04]",
                    compact ? "h-8 w-8" : "h-10 w-10"
                )}>
                    <Upload className={cn(
                        "text-white/40",
                        isDragActive && "text-primary",
                        compact ? "h-4 w-4" : "h-5 w-5"
                    )} />
                </div>
                <div className={compact ? "" : "space-y-1"}>
                    <p className={cn(
                        "font-medium",
                        compact ? "text-xs text-white/60" : "text-xs text-white/70"
                    )}>
                        {label}
                    </p>
                    {!compact && (
                        <p className="text-[10px] text-white/40">{description}</p>
                    )}
                </div>
            </div>
            {isDragActive && (
                <div className="absolute inset-0 rounded-lg bg-primary/5 flex items-center justify-center">
                    <p className="text-xs text-primary font-medium">Suelta el archivo aquí</p>
                </div>
            )}
        </div>
    )
}
