"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getContentBySection, updateContentByKey, WebContent } from "@/lib/web-content-service"
import { ContentInputField } from "@/components/web-management/ContentInputField"

export default function CTAPage() {
  const [content, setContent] = useState<WebContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())

  useEffect(() => { loadContent() }, [])

  const loadContent = async () => {
    setIsLoading(true)
    const data = await getContentBySection('cta')
    setContent(data)
    setIsLoading(false)
  }

  const handleChange = useCallback((clave: string, valor: string) => {
    setContent(prev => prev.map(c => c.clave === clave ? { ...c, valor } : c))
  }, [])

  const handleSave = useCallback(async (clave: string) => {
    const item = content.find(c => c.clave === clave)
    if (!item) return

    setIsSaving(true)
    const success = await updateContentByKey('cta', clave, item.valor)

    if (success) {
      setSavedFields(prev => new Set(prev).add(clave))
      setTimeout(() => {
        setSavedFields(prev => { const next = new Set(prev); next.delete(clave); return next })
      }, 2000)
    }

    setIsSaving(false)
  }, [content])

  const getValue = useCallback((clave: string) => {
    return content.find(c => c.clave === clave)?.valor || ''
  }, [content])

  if (isLoading) {
    return <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
    </div>
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
              <span className="material-symbols-outlined text-indigo-500">ads_click</span>
              Llamadas a la Acción
            </h1>
            <p className="text-sm text-slate-500 mt-1">Textos de financiación y coche a la carta</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>payments</span>
              Sección de Financiación
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="financiacion_badge" label="Badge / Etiqueta" value={getValue('financiacion_badge')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('financiacion_badge')} />
            <ContentInputField clave="financiacion_titulo" label="Título" value={getValue('financiacion_titulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('financiacion_titulo')} />
            <ContentInputField clave="financiacion_descripcion" label="Descripción" value={getValue('financiacion_descripcion')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('financiacion_descripcion')} multiline />
            <ContentInputField clave="financiacion_boton" label="Texto del botón" value={getValue('financiacion_boton')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('financiacion_boton')} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '20px' }}>search</span>
              Sección Coche a la Carta
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="coche_carta_badge" label="Badge / Etiqueta" value={getValue('coche_carta_badge')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('coche_carta_badge')} />
            <ContentInputField clave="coche_carta_titulo" label="Título" value={getValue('coche_carta_titulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('coche_carta_titulo')} />
            <ContentInputField clave="coche_carta_descripcion" label="Descripción" value={getValue('coche_carta_descripcion')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('coche_carta_descripcion')} multiline />
            <ContentInputField clave="coche_carta_boton" label="Texto del botón" value={getValue('coche_carta_boton')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('coche_carta_boton')} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '20px' }}>contact_support</span>
              Barra de Contacto
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="contacto_titulo" label="Título" value={getValue('contacto_titulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('contacto_titulo')} />
            <ContentInputField clave="contacto_subtitulo" label="Subtítulo" value={getValue('contacto_subtitulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('contacto_subtitulo')} />
          </div>
        </section>
      </main>
    </div>
  )
}
