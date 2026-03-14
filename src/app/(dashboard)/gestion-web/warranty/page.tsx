"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getContentBySection, updateContentByKey, WebContent } from "@/lib/web-content-service"
import { ContentInputField } from "@/components/web-management/ContentInputField"

export default function WarrantyPage() {
  const [content, setContent] = useState<WebContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setIsLoading(true)
    const data = await getContentBySection('warranty')
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
    const success = await updateContentByKey('warranty', clave, item.valor)

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
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-4 md:px-6 py-4">
          <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <div className="ml-4">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">shield</span>
              Garantía
            </h1>
            <p className="text-sm text-slate-500 mt-1">Información de la garantía</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Título y Descripción</h2>
          </div>
          <div className="p-5 space-y-4">
            <ContentInputField clave="titulo" label="Título principal" value={getValue('titulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('titulo')} />
            <ContentInputField clave="subtitulo" label="Descripción / Subtítulo" value={getValue('subtitulo')} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has('subtitulo')} multiline />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>check_circle</span>
              Qué CUBRE la garantía
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <ContentInputField key={i} clave={`cubierto_${i}`} label={`Elemento cubierto ${i}`} value={getValue(`cubierto_${i}`)} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has(`cubierto_${i}`)} />
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500" style={{ fontSize: '20px' }}>cancel</span>
              Qué NO cubre la garantía
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ContentInputField key={i} clave={`no_cubierto_${i}`} label={`Elemento NO cubierto ${i}`} value={getValue(`no_cubierto_${i}`)} onChange={handleChange} onSave={handleSave} isSaving={isSaving} isSaved={savedFields.has(`no_cubierto_${i}`)} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
