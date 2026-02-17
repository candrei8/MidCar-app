"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  generateSlug,
  BlogCategory
} from "@/lib/blog-service"

export default function CategoriasPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    imagen_url: '',
    orden: 0,
    activo: true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setIsLoading(true)
    const data = await getBlogCategories()
    setCategories(data)
    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!formData.nombre) {
      alert('El nombre es obligatorio')
      return
    }

    const newCategory = await createBlogCategory({
      ...formData,
      slug: formData.slug || generateSlug(formData.nombre),
      orden: categories.length,
    })

    if (newCategory) {
      setCategories([...categories, newCategory])
      setIsCreating(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.nombre) return

    const updated = await updateBlogCategory(editingId, formData)

    if (updated) {
      setCategories(categories.map(c => c.id === editingId ? { ...c, ...formData } : c))
      setEditingId(null)
      resetForm()
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Los artículos asociados quedarán sin categoría.`)) return

    const success = await deleteBlogCategory(id)
    if (success) {
      setCategories(categories.filter(c => c.id !== id))
    }
  }

  const startEdit = (category: BlogCategory) => {
    setEditingId(category.id)
    setIsCreating(false)
    setFormData({
      nombre: category.nombre,
      slug: category.slug,
      descripcion: category.descripcion || '',
      imagen_url: category.imagen_url || '',
      orden: category.orden,
      activo: category.activo,
    })
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      imagen_url: '',
      orden: 0,
      activo: true,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

  const handleNameChange = (nombre: string) => {
    setFormData({
      ...formData,
      nombre,
      slug: isCreating ? generateSlug(nombre) : formData.slug,
    })
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
            <Link href="/gestion-web/blog" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">category</span>
                Categorías del Blog
              </h1>
              <p className="text-sm text-slate-500 mt-1">Organiza tus artículos por categorías</p>
            </div>
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); resetForm() }}
            className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nueva Categoría
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        {/* Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">
              {isCreating ? 'Nueva Categoría' : 'Editar Categoría'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="nombre-categoria"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Breve descripción de la categoría"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen</label>
                <input
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec]"
                />
                <label htmlFor="activo" className="text-sm text-slate-700">Categoría activa (visible en la web)</label>
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

        {/* Categories List */}
        {categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl border ${category.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{category.nombre}</h3>
                        {!category.activo && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">Inactiva</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">/blog/categoria/{category.slug}</p>
                      {category.descripcion && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-1">{category.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.nombre)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '48px' }}>category</span>
            <p className="text-slate-500">No hay categorías todavía</p>
            <button
              onClick={() => { setIsCreating(true); resetForm() }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Crear primera categoría
            </button>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '24px' }}>info</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Las categorías ayudan a organizar los artículos del blog
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Los artículos sin categoría se mostrarán igualmente en el blog general
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
