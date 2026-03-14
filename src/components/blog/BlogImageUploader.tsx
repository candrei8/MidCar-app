"use client"

import { useState, useRef, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface BlogImageUploaderProps {
  currentImage: string
  onImageChange: (url: string) => void
}

export default function BlogImageUploader({ currentImage, onImageChange }: BlogImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      return 'Formato no válido. Usa JPG, PNG, WebP o GIF'
    }

    if (file.size > maxSize) {
      return 'La imagen es demasiado grande. Máximo 5MB'
    }

    return null
  }

  const uploadFile = async (file: File) => {
    if (!isSupabaseConfigured) {
      setError('Supabase no está configurado')
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `blog/${timestamp}-${randomId}.${extension}`

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const { data, error: uploadError } = await supabase.storage
        .from('web-images')
        .upload(fileName, file, {
          cacheControl: '31536000', // 1 year cache
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('web-images')
        .getPublicUrl(fileName)

      setUploadProgress(100)
      onImageChange(publicUrl)

      // Reset progress after animation
      setTimeout(() => setUploadProgress(0), 500)

    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleRemove = async () => {
    if (!currentImage) return

    // Try to delete from storage if it's our URL
    if (currentImage.includes('supabase') && isSupabaseConfigured) {
      try {
        const path = currentImage.split('/web-images/')[1]
        if (path) {
          await supabase.storage.from('web-images').remove([path])
        }
      } catch (err) {
        console.error('Error deleting image:', err)
      }
    }

    onImageChange('')
  }

  if (currentImage) {
    return (
      <div className="relative group">
        <img
          src={currentImage}
          alt="Imagen principal"
          className="w-full h-48 object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Cambiar imagen"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
          </button>
          <button
            onClick={handleRemove}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Eliminar imagen"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-[#135bec] bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#135bec] mx-auto"></div>
            <p className="text-sm text-slate-600">Subiendo imagen...</p>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#135bec] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <span className="material-symbols-outlined text-slate-400 mb-2" style={{ fontSize: '48px' }}>
              cloud_upload
            </span>
            <p className="text-sm text-slate-600 mb-1">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-400">
              JPG, PNG, WebP o GIF. Máximo 5MB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </p>
        </div>
      )}

      {/* URL fallback */}
      <div className="mt-3 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-2">O pega una URL:</p>
        <input
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          onBlur={(e) => {
            if (e.target.value) onImageChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
              onImageChange((e.target as HTMLInputElement).value)
            }
          }}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
        />
      </div>
    </div>
  )
}
