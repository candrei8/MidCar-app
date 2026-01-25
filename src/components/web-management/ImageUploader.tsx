"use client"

import { useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface ImageUploaderProps {
  clave: string
  label: string
  currentUrl: string
  onUpload: (clave: string, url: string) => void
  onSave: (clave: string) => void
  isSaving: boolean
  isSaved: boolean
  bucket?: string
  folder?: string
}

export function ImageUploader({
  clave,
  label,
  currentUrl,
  onUpload,
  onSave,
  isSaving,
  isSaved,
  bucket = "web-images",
  folder = "content"
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${clave}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Update preview and notify parent
      setPreviewUrl(publicUrl)
      onUpload(clave, publicUrl)
    } catch (err) {
      console.error('Error uploading:', err)
      setError('Error al subir la imagen. Verifica que el bucket existe.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [clave, folder, bucket])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const displayUrl = previewUrl || currentUrl

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-[#135bec] bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
            <span className="text-sm text-slate-500">Subiendo imagen...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-slate-400">
              cloud_upload
            </span>
            <div>
              <span className="text-sm font-medium text-[#135bec]">
                Arrastra una imagen aquí
              </span>
              <span className="text-sm text-slate-500"> o haz clic para seleccionar</span>
            </div>
            <span className="text-xs text-slate-400">PNG, JPG hasta 5MB</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
          {error}
        </p>
      )}

      {/* Preview */}
      {displayUrl && (
        <div className="relative">
          <p className="text-sm text-slate-500 mb-2">Vista previa:</p>
          <div className="relative rounded-lg overflow-hidden bg-slate-100 max-h-48">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-auto max-h-48 object-contain"
            />
          </div>

          {/* Save Button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onSave(clave)}
              disabled={isSaving || !previewUrl}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaved
                  ? 'bg-emerald-500 text-white'
                  : previewUrl
                    ? 'bg-[#135bec] hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSaved ? '✓ Guardado' : 'Guardar imagen'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
