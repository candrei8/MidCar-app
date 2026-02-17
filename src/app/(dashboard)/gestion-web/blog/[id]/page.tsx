"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getBlogPostById,
  updateBlogPost,
  getBlogCategories,
  generateSlug,
  BlogPost,
  BlogCategory
} from "@/lib/blog-service"
import BlogImageUploader from "@/components/blog/BlogImageUploader"
import MarkdownEditor from "@/components/blog/MarkdownEditor"

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    extracto: '',
    contenido: '',
    imagen_principal: '',
    categoria_id: '',
    autor: 'MID Car',
    tags: [] as string[],
    seo_titulo: '',
    seo_descripcion: '',
    seo_keywords: '',
    estado: 'borrador' as 'borrador' | 'publicado' | 'archivado',
    destacado: false,
    orden: 0,
    fecha_publicacion: null as string | null,
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    const [post, categoriesData] = await Promise.all([
      getBlogPostById(id),
      getBlogCategories()
    ])

    if (!post) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    setCategories(categoriesData)
    setFormData({
      titulo: post.titulo,
      slug: post.slug,
      extracto: post.extracto || '',
      contenido: post.contenido,
      imagen_principal: post.imagen_principal || '',
      categoria_id: post.categoria_id || '',
      autor: post.autor,
      tags: post.tags || [],
      seo_titulo: post.seo_titulo || '',
      seo_descripcion: post.seo_descripcion || '',
      seo_keywords: post.seo_keywords || '',
      estado: post.estado,
      destacado: post.destacado,
      orden: post.orden,
      fecha_publicacion: post.fecha_publicacion,
    })
    setIsLoading(false)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.contenido) {
      alert('El título y el contenido son obligatorios')
      return
    }

    setIsSaving(true)

    const postData = {
      ...formData,
      categoria_id: formData.categoria_id || null,
      fecha_publicacion: formData.estado === 'publicado'
        ? formData.fecha_publicacion || new Date().toISOString()
        : formData.fecha_publicacion,
    }

    const updatedPost = await updateBlogPost(id, postData)

    if (updatedPost) {
      router.push('/gestion-web/blog')
    } else {
      alert('Error al actualizar el artículo')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '64px' }}>article</span>
        <p className="text-xl text-slate-600">Artículo no encontrado</p>
        <Link
          href="/gestion-web/blog"
          className="px-4 py-2 bg-[#135bec] text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al blog
        </Link>
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
                <span className="material-symbols-outlined text-orange-500">edit</span>
                Editar Artículo
              </h1>
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{formData.titulo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gestion-web/blog"
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Información Básica</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título del artículo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-del-articulo"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, slug: generateSlug(formData.titulo) })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Regenerar desde título"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>refresh</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Extracto</label>
                  <textarea
                    value={formData.extracto}
                    onChange={(e) => setFormData({ ...formData, extracto: e.target.value })}
                    placeholder="Breve resumen del artículo (aparece en listados y SEO)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                Contenido <span className="text-red-500">*</span>
              </h2>
              <MarkdownEditor
                value={formData.contenido}
                onChange={(contenido) => setFormData({ ...formData, contenido })}
                placeholder="Escribe el contenido del artículo..."
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>search</span>
                SEO
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título SEO <span className="text-xs text-slate-400">(máx. 70 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.seo_titulo}
                    onChange={(e) => setFormData({ ...formData, seo_titulo: e.target.value })}
                    placeholder={formData.titulo || 'Título para buscadores'}
                    maxLength={70}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                  />
                  <div className={`text-xs mt-1 ${formData.seo_titulo.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {formData.seo_titulo.length}/70
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción SEO <span className="text-xs text-slate-400">(máx. 160 caracteres)</span>
                  </label>
                  <textarea
                    value={formData.seo_descripcion}
                    onChange={(e) => setFormData({ ...formData, seo_descripcion: e.target.value })}
                    placeholder={formData.extracto || 'Descripción para buscadores'}
                    maxLength={160}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent resize-none"
                  />
                  <div className={`text-xs mt-1 ${formData.seo_descripcion.length > 140 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {formData.seo_descripcion.length}/160
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Palabras Clave</label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    placeholder="coches segunda mano, comprar coche, garantía vehículos"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                  />
                </div>

                {/* SEO Preview */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Vista previa en Google:</p>
                  <div className="space-y-1">
                    <p className="text-[#1a0dab] text-lg truncate hover:underline cursor-pointer">
                      {formData.seo_titulo || formData.titulo || 'Título del artículo'} - MID Car
                    </p>
                    <p className="text-[#006621] text-sm">www.midcar.es/blog/{formData.slug || 'url-del-articulo'}</p>
                    <p className="text-sm text-[#545454] line-clamp-2">
                      {formData.seo_descripcion || formData.extracto || 'Descripción del artículo que aparecerá en los resultados de búsqueda...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Publicación</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'borrador' | 'publicado' | 'archivado' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="publicado">Publicado</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#135bec] focus:ring-[#135bec]"
                  />
                  <label htmlFor="destacado" className="text-sm text-slate-700">Artículo destacado</label>
                </div>

                {formData.estado === 'publicado' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de publicación</label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_publicacion?.slice(0, 16) || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_publicacion: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Imagen Principal</h2>
              <BlogImageUploader
                currentImage={formData.imagen_principal}
                onImageChange={(url) => setFormData({ ...formData, imagen_principal: url })}
              />
            </div>

            {/* Categoría */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Categoría</h2>
              <select
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Autor */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Autor</h2>
              <input
                type="text"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                placeholder="Nombre del autor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Etiquetas</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Nueva etiqueta"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec]"
                />
                <button
                  onClick={handleAddTag}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg"
                    >
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
