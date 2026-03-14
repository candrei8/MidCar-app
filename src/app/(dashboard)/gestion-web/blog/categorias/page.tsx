"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-red-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 font-medium">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>category</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Categorías del Blog</h1>
                <p className="text-xs text-slate-500 mt-0.5">Organiza tus artículos por categorías</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); resetForm() }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nueva Categoría
          </button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
        {/* Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-in">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-600" style={{ fontSize: '20px' }}>
                {isCreating ? 'add_circle' : 'edit'}
              </span>
              {isCreating ? 'Nueva Categoría' : 'Editar Categoría'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="nombre-categoria"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Breve descripción de la categoría"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL de imagen</label>
                <input
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-100/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="text-sm font-semibold text-emerald-800">Categoría activa</span>
                  <p className="text-xs text-emerald-600 mt-0.5">Visible en la web pública</p>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={isCreating ? handleCreate : handleUpdate}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all text-sm"
                >
                  {isCreating ? 'Crear categoría' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "bg-white rounded-2xl border border-slate-200/80 p-5 transition-all hover:shadow-md",
                  !category.activo && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-violet-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{category.nombre}</h3>
                        {!category.activo && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium border border-slate-200">Inactiva</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5 font-mono">/blog/categoria/{category.slug}</p>
                      {category.descripcion && (
                        <p className="text-sm text-slate-600 mt-1.5 line-clamp-1">{category.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400 hover:text-red-600" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.nombre)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-slate-400 hover:text-red-600" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-violet-400" style={{ fontSize: '32px' }}>category</span>
            </div>
            <p className="text-slate-700 font-medium mb-1">No hay categorías todavía</p>
            <p className="text-sm text-slate-400 mb-6">Crea categorías para organizar los artículos del blog</p>
            <button
              onClick={() => { setIsCreating(true); resetForm() }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all text-sm hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Crear primera categoría
            </button>
          </div>
        )}

        {/* Info */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-violet-400" style={{ fontSize: '22px' }}>info</span>
            </div>
            <div>
              <p className="text-sm text-white font-semibold">Organización del blog</p>
              <p className="text-sm text-slate-400 mt-1">
                Las categorías ayudan a organizar los artículos. Los artículos sin categoría se mostrarán igualmente en el blog general.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
