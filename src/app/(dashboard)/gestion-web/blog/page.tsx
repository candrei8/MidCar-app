"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  getBlogPosts,
  getBlogCategories,
  deleteBlogPost,
  BlogPost,
  BlogCategory
} from "@/lib/blog-service"

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    categoria_id: '',
    estado: '',
    search: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadPosts()
  }, [filters])

  const loadData = async () => {
    setIsLoading(true)
    const [postsData, categoriesData] = await Promise.all([
      getBlogPosts(),
      getBlogCategories()
    ])
    setPosts(postsData)
    setCategories(categoriesData)
    setIsLoading(false)
  }

  const loadPosts = async () => {
    const postsData = await getBlogPosts({
      categoria_id: filters.categoria_id || undefined,
      estado: filters.estado || undefined,
      search: filters.search || undefined,
    })
    setPosts(postsData)
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar el artículo "${titulo}"? Esta acción no se puede deshacer.`)) return
    const success = await deleteBlogPost(id)
    if (success) {
      setPosts(posts.filter(p => p.id !== id))
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'publicado':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Publicado</span>
      case 'borrador':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Borrador</span>
      case 'archivado':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">Archivado</span>
      default:
        return null
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
            <Link href="/gestion-web" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">rss_feed</span>
                Blog
              </h1>
              <p className="text-sm text-slate-500 mt-1">Gestiona los artículos del blog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gestion-web/blog/categorias"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>category</span>
              <span className="hidden sm:inline">Categorías</span>
            </Link>
            <Link
              href="/gestion-web/blog/nuevo"
              className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Nuevo Artículo
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '20px' }}>article</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{posts.length}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '20px' }}>check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{posts.filter(p => p.estado === 'publicado').length}</p>
                <p className="text-xs text-slate-500">Publicados</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '20px' }}>edit_note</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{posts.filter(p => p.estado === 'borrador').length}</p>
                <p className="text-xs text-slate-500">Borradores</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600" style={{ fontSize: '20px' }}>category</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                <p className="text-xs text-slate-500">Categorías</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '20px' }}>search</span>
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.categoria_id}
                onChange={(e) => setFilters({ ...filters, categoria_id: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="publicado">Publicados</option>
                <option value="borrador">Borradores</option>
                <option value="archivado">Archivados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {posts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {post.imagen_principal ? (
                        <img
                          src={post.imagen_principal}
                          alt={post.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '32px' }}>image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 line-clamp-1">{post.titulo}</h3>
                            {post.destacado && (
                              <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '16px' }}>star</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{post.extracto || 'Sin extracto'}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            href={`/gestion-web/blog/${post.id}`}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.titulo)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {getEstadoBadge(post.estado)}
                        {post.categoria && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {post.categoria.nombre}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {formatDate(post.fecha_publicacion || post.created_at)}
                        </span>
                        <span className="text-xs text-slate-400">
                          por {post.autor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-slate-300 mb-2" style={{ fontSize: '48px' }}>article</span>
              <p className="text-slate-500">No hay artículos</p>
              <Link
                href="/gestion-web/blog/nuevo"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Crear primer artículo
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
