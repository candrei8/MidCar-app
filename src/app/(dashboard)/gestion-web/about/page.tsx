"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getContentBySection, updateContentByKey, WebContent } from "@/lib/web-content-service"
import { ContentInputField } from "@/components/web-management/ContentInputField"
import { ImageUploader } from "@/components/web-management/ImageUploader"

export default function AboutPage() {
  const [content, setContent] = useState<WebContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setIsLoading(true)
    const data = await getContentBySection('about')
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
    const success = await updateContentByKey('about', clave, item.valor)

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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-4 md:px-6 py-4">
          <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <div className="ml-4">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">info</span>
              Sobre Nosotros
            </h1>
            <p className="text-sm text-slate-500 mt-1">Información de la empresa</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Títulos</h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="label" label="Etiqueta superior" value={getValue('label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('label')} />
            <ContentInputField clave="titulo" label="Título principal" value={getValue('titulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('titulo')} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Contenido</h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="parrafo_principal" label="Párrafo principal" value={getValue('parrafo_principal')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('parrafo_principal')} multiline />
            <ContentInputField clave="parrafo_2" label="Párrafo 2 (expandible)" value={getValue('parrafo_2')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('parrafo_2')} multiline />
            <ContentInputField clave="parrafo_3" label="Párrafo 3 (expandible)" value={getValue('parrafo_3')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('parrafo_3')} multiline />
            <ContentInputField clave="parrafo_4" label="Párrafo 4 (expandible)" value={getValue('parrafo_4')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('parrafo_4')} multiline />
            <ContentInputField clave="parrafo_5" label="Párrafo 5 (expandible)" value={getValue('parrafo_5')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('parrafo_5')} multiline />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Estadísticas</h2>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <ContentInputField clave="stat_1_valor" label="Stat 1 - Valor" value={getValue('stat_1_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_1_valor')} />
              <ContentInputField clave="stat_1_label" label="Stat 1 - Descripción" value={getValue('stat_1_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_1_label')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ContentInputField clave="stat_2_valor" label="Stat 2 - Valor" value={getValue('stat_2_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_2_valor')} />
              <ContentInputField clave="stat_2_label" label="Stat 2 - Descripción" value={getValue('stat_2_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_2_label')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ContentInputField clave="stat_3_valor" label="Stat 3 - Valor" value={getValue('stat_3_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_3_valor')} />
              <ContentInputField clave="stat_3_label" label="Stat 3 - Descripción" value={getValue('stat_3_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_3_label')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ContentInputField clave="stat_4_valor" label="Stat 4 - Valor" value={getValue('stat_4_valor')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_4_valor')} />
              <ContentInputField clave="stat_4_label" label="Stat 4 - Descripción" value={getValue('stat_4_label')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('stat_4_label')} />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Imagen</h2>
            <p className="text-sm text-slate-500 mt-1">
              Arrastra una imagen o selecciona un archivo
            </p>
          </div>
          <div className="p-5">
            <ImageUploader
              clave="imagen_url"
              label="Imagen de Sobre Nosotros"
              currentUrl={getValue('imagen_url')}
              onUpload={handleChange}
              onSave={handleSave}
              isSaving={isSaving}
              isSaved={savedFields.has('imagen_url')}
              folder="about"
            />
          </div>
        </section>
      </main>
    </div>
  )
}
