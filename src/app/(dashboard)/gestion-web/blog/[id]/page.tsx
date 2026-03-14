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
      router.push('/gestion-web')
    } else {
      alert('Error al actualizar el artículo')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-red-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 font-medium">Cargando artículo...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '40px' }}>article</span>
        </div>
        <p className="text-xl font-bold text-slate-700">Artículo no encontrado</p>
        <p className="text-sm text-slate-500">El artículo que buscas no existe o ha sido eliminado.</p>
        <Link
          href="/gestion-web"
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm mt-2"
        >
          Volver al blog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/20">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>edit</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Editar Artículo</h1>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{formData.titulo}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gestion-web"
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600" style={{ fontSize: '20px' }}>text_fields</span>
                Información Básica
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título del artículo"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug (URL)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400 font-medium">/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-del-articulo"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all font-mono"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, slug: generateSlug(formData.titulo) })}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Regenerar desde título"
                    >
                      <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '20px' }}>refresh</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Extracto</label>
                  <textarea
                    value={formData.extracto}
                    onChange={(e) => setFormData({ ...formData, extracto: e.target.value })}
                    placeholder="Breve resumen del artículo (aparece en listados y SEO)"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600" style={{ fontSize: '20px' }}>edit_note</span>
                Contenido <span className="text-red-500 text-sm">*</span>
              </h2>
              <MarkdownEditor
                value={formData.contenido}
                onChange={(contenido) => setFormData({ ...formData, contenido })}
                placeholder="Escribe el contenido del artículo en Markdown..."
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '20px' }}>search</span>
                SEO - Optimización para buscadores
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Título SEO <span className="text-xs text-slate-400 font-normal">(máx. 70 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.seo_titulo}
                    onChange={(e) => setFormData({ ...formData, seo_titulo: e.target.value })}
                    placeholder={formData.titulo || 'Título para buscadores'}
                    maxLength={70}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-medium ${formData.seo_titulo.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {formData.seo_titulo.length}/70
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Descripción SEO <span className="text-xs text-slate-400 font-normal">(máx. 160 caracteres)</span>
                  </label>
                  <textarea
                    value={formData.seo_descripcion}
                    onChange={(e) => setFormData({ ...formData, seo_descripcion: e.target.value })}
                    placeholder={formData.extracto || 'Descripción para buscadores'}
                    maxLength={160}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none transition-all"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-medium ${formData.seo_descripcion.length > 140 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {formData.seo_descripcion.length}/160
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Palabras Clave</label>
                  <input
                    type="text"
                    value={formData.seo_keywords}
                    onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                    placeholder="coches segunda mano, comprar coche, garantía vehículos"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                  />
                </div>

                {/* SEO Preview */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Vista previa en Google</p>
                  <div className="space-y-1 bg-white p-4 rounded-lg border border-slate-100">
                    <p className="text-[#1a0dab] text-lg truncate hover:underline cursor-pointer font-medium">
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
          <div className="space-y-5">
            {/* Estado */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600" style={{ fontSize: '20px' }}>publish</span>
                Publicación
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'borrador' | 'publicado' | 'archivado' })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="publicado">Publicado</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-amber-800">Artículo destacado</span>
                    <p className="text-xs text-amber-600 mt-0.5">Aparecerá en posiciones destacadas</p>
                  </div>
                </label>

                {formData.estado === 'publicado' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha de publicación</label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_publicacion?.slice(0, 16) || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_publicacion: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600" style={{ fontSize: '20px' }}>image</span>
                Imagen Principal
              </h2>
              <BlogImageUploader
                currentImage={formData.imagen_principal}
                onImageChange={(url) => setFormData({ ...formData, imagen_principal: url })}
              />
            </div>

            {/* Categoría */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600" style={{ fontSize: '20px' }}>category</span>
                Categoría
              </h2>
              <select
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <Link
                href="/gestion-web/blog/categorias"
                className="inline-flex items-center gap-1 mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                Gestionar categorías
              </Link>
            </div>

            {/* Autor */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600" style={{ fontSize: '20px' }}>person</span>
                Autor
              </h2>
              <input
                type="text"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                placeholder="Nombre del autor"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600" style={{ fontSize: '20px' }}>sell</span>
                Etiquetas
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Nueva etiqueta"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                />
                <button
                  onClick={handleAddTag}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: '20px' }}>add</span>
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full font-medium border border-red-100"
                    >
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-900 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
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
