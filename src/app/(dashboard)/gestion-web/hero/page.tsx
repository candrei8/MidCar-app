"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getContentBySection, updateContentByKey, WebContent } from "@/lib/web-content-service"
import { ImageUploader } from "@/components/web-management/ImageUploader"

// InputField FUERA del componente principal para evitar re-renders
function InputField({
  clave,
  label,
  value,
  onChange,
  onSave,
  isSaving,
  isSaved,
  type = 'text',
  multiline = false
}: {
  clave: string
  label: string
  value: string
  onChange: (clave: string, value: string) => void
  onSave: (clave: string) => void
  isSaving: boolean
  isSaved: boolean
  type?: string
  multiline?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(clave, e.target.value)}
            rows={3}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(clave, e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
          />
        )}
        <button
          onClick={() => onSave(clave)}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            isSaved
              ? 'bg-emerald-500 text-white'
              : 'bg-[#135bec] hover:bg-blue-700 text-white'
          }`}
        >
          {isSaved ? '✓' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function HeroPage() {
  const [content, setContent] = useState<WebContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setIsLoading(true)
    const data = await getContentBySection('hero')
    setContent(data)
    setIsLoading(false)
  }

  const handleChange = useCallback((clave: string, valor: string) => {
    setContent(prev => prev.map(c =>
      c.clave === clave ? { ...c, valor } : c
    ))
  }, [])

  const handleSave = useCallback(async (clave: string) => {
    const item = content.find(c => c.clave === clave)
    if (!item) return

    setIsSaving(true)
    const success = await updateContentByKey('hero', clave, item.valor)

    if (success) {
      setSavedFields(prev => new Set(prev).add(clave))
      setTimeout(() => {
        setSavedFields(prev => {
          const next = new Set(prev)
          next.delete(clave)
          return next
        })
      }, 2000)
    }

    setIsSaving(false)
  }, [content])

  const getValue = useCallback((clave: string) => {
    return content.find(c => c.clave === clave)?.valor || ''
  }, [content])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/gestion-web"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">web</span>
                Hero / Banner Principal
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Contenido de la sección principal de la web
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Titles */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Títulos y Textos</h2>
          </div>
          <div className="p-5 space-y-4">
            <InputField clave="badge" label="Badge / Etiqueta superior" value={getValue('badge')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('badge')} />
            <InputField clave="titulo_1" label="Título (línea 1)" value={getValue('titulo_1')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('titulo_1')} />
            <InputField clave="titulo_2" label="Título (línea 2 - destacado)" value={getValue('titulo_2')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('titulo_2')} />
            <InputField clave="subtitulo" label="Subtítulo / Descripción" value={getValue('subtitulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('subtitulo')} multiline />
          </div>
        </section>

        {/* CTAs */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Botones de Acción</h2>
          </div>
          <div className="p-5 space-y-4">
            <InputField clave="cta_primario" label="Botón primario (texto)" value={getValue('cta_primario')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('cta_primario')} />
            <InputField clave="cta_secundario" label="Botón secundario (texto)" value={getValue('cta_secundario')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('cta_secundario')} />
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Estadísticas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Se muestran debajo del título principal
            </p>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputField clave="stat_1_valor" label="Stat 1 - Valor" value={getValue('stat_1_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_1_valor')} />
              <InputField clave="stat_1_label" label="Stat 1 - Descripción" value={getValue('stat_1_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_1_label')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField clave="stat_2_valor" label="Stat 2 - Valor" value={getValue('stat_2_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_2_valor')} />
              <InputField clave="stat_2_label" label="Stat 2 - Descripción" value={getValue('stat_2_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_2_label')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField clave="stat_3_valor" label="Stat 3 - Valor" value={getValue('stat_3_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_3_valor')} />
              <InputField clave="stat_3_label" label="Stat 3 - Descripción" value={getValue('stat_3_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_3_label')} />
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Badges Flotantes</h2>
          </div>
          <div className="p-5 space-y-4">
            <InputField clave="precio_desde" label="Precio desde (ej: 7.900€)" value={getValue('precio_desde')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('precio_desde')} />
            <InputField clave="garantia_badge" label="Badge de garantía" value={getValue('garantia_badge')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('garantia_badge')} />
          </div>
        </section>

        {/* Image */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Imagen Principal</h2>
            <p className="text-sm text-slate-500 mt-1">
              Arrastra una imagen o selecciona un archivo
            </p>
          </div>
          <div className="p-5">
            <ImageUploader
              clave="imagen_url"
              label="Imagen del Hero"
              currentUrl={getValue('imagen_url')}
              onUpload={handleChange}
              onSave={handleSave}
              isSaving={isSaving}
              isSaved={savedFields.has('imagen_url')}
              folder="hero"
            />
          </div>
        </section>
      </main>
    </div>
  )
}
