"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getBenefits, createBenefit, updateBenefit, deleteBenefit, WebBenefit } from "@/lib/web-content-service"

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<WebBenefit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    icono: 'check_circle',
    activo: true,
    orden: 0,
  })

  useEffect(() => {
    loadBenefits()
  }, [])

  const loadBenefits = async () => {
    setIsLoading(true)
    const data = await getBenefits()
    setBenefits(data)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    const newBenefit = await createBenefit({
      ...formData,
      orden: benefits.length,
    })
    if (newBenefit) {
      setBenefits([...benefits, newBenefit])
      setIsCreating(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    const success = await updateBenefit(editingId, formData)
    if (success) {
      setBenefits(benefits.map(b => b.id === editingId ? { ...b, ...formData } : b))
      setEditingId(null)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este beneficio?')) return
    const success = await deleteBenefit(id)
    if (success) setBenefits(benefits.filter(b => b.id !== id))
  }

  const startEdit = (benefit: WebBenefit) => {
    setEditingId(benefit.id)
    setFormData({
      titulo: benefit.titulo,
      descripcion: benefit.descripcion,
      icono: benefit.icono || 'check_circle',
      activo: benefit.activo,
      orden: benefit.orden,
    })
  }

  const resetForm = () => setFormData({ titulo: '', descripcion: '', icono: 'check_circle', activo: true, orden: 0 })
  const cancelEdit = () => { setEditingId(null); setIsCreating(false); resetForm() }

  const icons = ['check_circle', 'shield', 'verified', 'handshake', 'star', 'thumb_up', 'favorite', 'workspace_premium', 'military_tech', 'auto_awesome']

  if (isLoading) {
    return <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">verified</span>
                Beneficios / Ventajas
              </h1>
              <p className="text-sm text-slate-500 mt-1">Por qué comprar en MID Car</p>
            </div>
          </div>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Beneficio
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">{isCreating ? 'Nuevo Beneficio' : 'Editar Beneficio'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData({ ...formData, icono: icon })}
                      className={`p-2 rounded-lg border ${formData.icono === icon ? 'border-[#135bec] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </button>
                  ))}
                </div>
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

        {benefits.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '48px' }}>verified</span>
            <p className="text-slate-500">No hay beneficios todavía</p>
          </div>
        ) : (
          benefits.map(benefit => (
            <div key={benefit.id} className={`bg-white rounded-xl border ${benefit.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600">{benefit.icono || 'check_circle'}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{benefit.titulo}</h3>
                    <p className="text-sm text-slate-600 mt-1">{benefit.descripcion}</p>
                    {!benefit.activo && <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">Oculto</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(benefit)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>edit</span>
                  </button>
                  <button onClick={() => handleDelete(benefit.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
