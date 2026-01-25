"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getFAQs, createFAQ, updateFAQ, deleteFAQ, WebFAQ } from "@/lib/web-content-service"

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<WebFAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    seccion: 'financiacion',
    pregunta: '',
    respuesta: '',
    activo: true,
    orden: 0,
  })

  useEffect(() => { loadFAQs() }, [])

  const loadFAQs = async () => {
    setIsLoading(true)
    const data = await getFAQs()
    setFaqs(data)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    const newFAQ = await createFAQ({ ...formData, orden: faqs.length })
    if (newFAQ) { setFaqs([...faqs, newFAQ]); setIsCreating(false); resetForm() }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const success = await updateFAQ(editingId, formData)
    if (success) { setFaqs(faqs.map(f => f.id === editingId ? { ...f, ...formData } : f)); setEditingId(null); resetForm() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    const success = await deleteFAQ(id)
    if (success) setFaqs(faqs.filter(f => f.id !== id))
  }

  const startEdit = (faq: WebFAQ) => {
    setEditingId(faq.id)
    setFormData({ seccion: faq.seccion, pregunta: faq.pregunta, respuesta: faq.respuesta, activo: faq.activo, orden: faq.orden })
  }

  const resetForm = () => setFormData({ seccion: 'financiacion', pregunta: '', respuesta: '', activo: true, orden: 0 })
  const cancelEdit = () => { setEditingId(null); setIsCreating(false); resetForm() }

  const secciones = [
    { value: 'financiacion', label: 'Financiación' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'general', label: 'General' },
  ]

  if (isLoading) {
    return <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-500">help</span>
                Preguntas Frecuentes
              </h1>
              <p className="text-sm text-slate-500 mt-1">FAQs de financiación y garantía</p>
            </div>
          </div>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nueva Pregunta
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">{isCreating ? 'Nueva Pregunta' : 'Editar Pregunta'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sección</label>
                <select value={formData.seccion} onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]">
                  {secciones.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pregunta</label>
                <input type="text" value={formData.pregunta} onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                  placeholder="¿...?" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Respuesta</label>
                <textarea value={formData.respuesta} onChange={(e) => setFormData({ ...formData, respuesta: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="activo" className="text-sm text-slate-700">Mostrar en la web</label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
                <button onClick={isCreating ? handleCreate : handleUpdate} className="px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium">
                  {isCreating ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {secciones.map(seccion => {
          const seccionFaqs = faqs.filter(f => f.seccion === seccion.value)
          if (seccionFaqs.length === 0) return null
          return (
            <div key={seccion.value}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">{seccion.label}</h2>
              <div className="space-y-2">
                {seccionFaqs.map(faq => (
                  <div key={faq.id} className={`bg-white rounded-xl border ${faq.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{faq.pregunta}</h3>
                        <p className="text-sm text-slate-600 mt-1">{faq.respuesta}</p>
                        {!faq.activo && <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">Oculto</span>}
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button onClick={() => startEdit(faq)} className="p-2 hover:bg-slate-100 rounded-lg">
                          <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-red-50 rounded-lg">
                          <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {faqs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '48px' }}>help</span>
            <p className="text-slate-500">No hay preguntas frecuentes todavía</p>
          </div>
        )}
      </main>
    </div>
  )
}
