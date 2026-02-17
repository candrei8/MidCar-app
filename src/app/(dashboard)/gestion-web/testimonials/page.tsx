"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  WebTestimonial
} from "@/lib/web-content-service"

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<WebTestimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    fecha: '',
    rating: 5,
    texto: '',
    activo: true,
    orden: 0,
  })

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    setIsLoading(true)
    const data = await getTestimonials()
    setTestimonials(data)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    const newTestimonial = await createTestimonial({
      ...formData,
      orden: testimonials.length,
    })

    if (newTestimonial) {
      setTestimonials([...testimonials, newTestimonial])
      setIsCreating(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return

    const success = await updateTestimonial(editingId, formData)

    if (success) {
      setTestimonials(testimonials.map(t =>
        t.id === editingId ? { ...t, ...formData } : t
      ))
      setEditingId(null)
      resetForm()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este testimonio?')) return

    const success = await deleteTestimonial(id)

    if (success) {
      setTestimonials(testimonials.filter(t => t.id !== id))
    }
  }

  const startEdit = (testimonial: WebTestimonial) => {
    setEditingId(testimonial.id)
    setFormData({
      nombre: testimonial.nombre,
      fecha: testimonial.fecha,
      rating: testimonial.rating,
      texto: testimonial.texto,
      activo: testimonial.activo,
      orden: testimonial.orden,
    })
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      fecha: '',
      rating: 5,
      texto: '',
      activo: true,
      orden: 0,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

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
                <span className="material-symbols-outlined text-pink-500">rate_review</span>
                Testimonios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Reseñas y opiniones de clientes
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Testimonio
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">
              {isCreating ? 'Nuevo Testimonio' : 'Editar Testimonio'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del cliente
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Carlos M."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha (texto)
                  </label>
                  <input
                    type="text"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    placeholder="Ej: Hace 2 meses"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valoración
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Texto del testimonio
                </label>
                <textarea
                  value={formData.texto}
                  onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                  rows={3}
                  placeholder="Escribe aquí la opinión del cliente..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-[#135bec] rounded"
                />
                <label htmlFor="activo" className="text-sm text-slate-700">
                  Mostrar en la web
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={isCreating ? handleCreate : handleUpdate}
                  className="px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {isCreating ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials List */}
        {testimonials.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '48px' }}>
              rate_review
            </span>
            <p className="text-slate-500">No hay testimonios todavía</p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-xl border ${
                testimonial.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'
              } p-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900">{testimonial.nombre}</span>
                    <span className="text-sm text-slate-500">{testimonial.fecha}</span>
                    {!testimonial.activo && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">
                        Oculto
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= testimonial.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-600">{testimonial.texto}</p>
                </div>
                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => startEdit(testimonial)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>
                      delete
                    </span>
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
