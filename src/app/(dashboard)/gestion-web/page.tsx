"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  getBlogPosts,
  getBlogCategories,
  deleteBlogPost,
  BlogPost,
  BlogCategory
} from "@/lib/blog-service"
import {
  getTestimonials,
  getBenefits,
  getFAQs,
  WebTestimonial,
  WebBenefit,
  WebFAQ
} from "@/lib/web-content-service"

// ============================================
// Types
// ============================================

type Tab = 'inicio' | 'blog' | 'empresa'

interface Stats {
  posts: number
  published: number
  drafts: number
  categories: number
  testimonials: number
  benefits: number
  faqs: number
}

// ============================================
// Homepage Section Cards
// ============================================

const homepageSections = [
  {
    id: 'hero',
    title: 'Hero / Banner Principal',
    description: 'Título, subtítulo, estadísticas, precio, botones CTA y modelo 3D',
    icon: 'view_in_ar',
    href: '/gestion-web/hero',
    color: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    order: 1,
  },
  {
    id: 'benefits',
    title: 'Beneficios / Ventajas',
    description: 'Tarjetas con las ventajas de comprar en MID Car',
    icon: 'verified',
    href: '/gestion-web/benefits',
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    order: 2,
  },
  {
    id: 'about',
    title: 'Sobre Nosotros',
    description: 'Historia, párrafos descriptivos, estadísticas e imagen',
    icon: 'info',
    href: '/gestion-web/about',
    color: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    order: 3,
  },
  {
    id: 'warranty',
    title: 'Garantía',
    description: 'Información de garantía: qué cubre y qué no cubre',
    icon: 'shield',
    href: '/gestion-web/warranty',
    color: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    order: 4,
  },
  {
    id: 'testimonials',
    title: 'Testimonios',
    description: 'Opiniones y valoraciones de clientes reales',
    icon: 'rate_review',
    href: '/gestion-web/testimonials',
    color: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    order: 5,
  },
  {
    id: 'cta',
    title: 'Llamadas a la Acción',
    description: 'Secciones de financiación, coche a la carta y contacto',
    icon: 'ads_click',
    href: '/gestion-web/cta',
    color: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    order: 6,
  },
]

// ============================================
// Tab definitions
// ============================================

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Página Principal', icon: 'home' },
  { id: 'blog', label: 'Blog', icon: 'rss_feed' },
  { id: 'empresa', label: 'Empresa & Config', icon: 'settings' },
]

// ============================================
// Main Component
// ============================================

export default function GestionWebPage() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio')
  const [stats, setStats] = useState<Stats>({
    posts: 0, published: 0, drafts: 0, categories: 0,
    testimonials: 0, benefits: 0, faqs: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [blogFilters, setBlogFilters] = useState({ search: '', categoria_id: '', estado: '' })

  // Empresa state
  const [testimonials, setTestimonials] = useState<WebTestimonial[]>([])
  const [benefits, setBenefits] = useState<WebBenefit[]>([])
  const [faqs, setFaqs] = useState<WebFAQ[]>([])

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (activeTab === 'blog') {
      loadFilteredPosts()
    }
  }, [blogFilters])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const [postsData, categoriesData, testimonialsData, benefitsData, faqsData] = await Promise.all([
        getBlogPosts(),
        getBlogCategories(),
        getTestimonials(),
        getBenefits(),
        getFAQs(),
      ])

      setPosts(postsData)
      setCategories(categoriesData)
      setTestimonials(testimonialsData)
      setBenefits(benefitsData)
      setFaqs(faqsData)

      setStats({
        posts: postsData.length,
        published: postsData.filter(p => p.estado === 'publicado').length,
        drafts: postsData.filter(p => p.estado === 'borrador').length,
        categories: categoriesData.length,
        testimonials: testimonialsData.length,
        benefits: benefitsData.length,
        faqs: faqsData.length,
      })
    } catch (err) {
      console.error('Error loading data:', err)
    }
    setIsLoading(false)
  }

  const loadFilteredPosts = async () => {
    const data = await getBlogPosts({
      categoria_id: blogFilters.categoria_id || undefined,
      estado: blogFilters.estado || undefined,
      search: blogFilters.search || undefined,
    })
    setPosts(data)
  }

  const handleDeletePost = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? No se puede deshacer.`)) return
    const success = await deleteBlogPost(id)
    if (success) {
      setPosts(posts.filter(p => p.id !== id))
      setStats(prev => ({ ...prev, posts: prev.posts - 1 }))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      publicado: 'bg-emerald-100 text-emerald-700',
      borrador: 'bg-amber-100 text-amber-700',
      archivado: 'bg-slate-100 text-slate-600',
    }
    const labels: Record<string, string> = {
      publicado: 'Publicado',
      borrador: 'Borrador',
      archivado: 'Archivado',
    }
    return (
      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", styles[estado])}>
        {labels[estado]}
      </span>
    )
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
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#135bec]">language</span>
              Gestión Web
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Edita el contenido de midcar.es en tiempo real
            </p>
          </div>
          <a
            href="https://www.midcar.es"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
            Ver web
          </a>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 px-4 md:px-6 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all",
                activeTab === tab.id
                  ? "border-[#135bec] text-[#135bec] bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {activeTab === 'inicio' && <InicioTab stats={stats} />}
        {activeTab === 'blog' && (
          <BlogTab
            posts={posts}
            categories={categories}
            stats={stats}
            filters={blogFilters}
            onFilterChange={setBlogFilters}
            onDelete={handleDeletePost}
            formatDate={formatDate}
            getEstadoBadge={getEstadoBadge}
          />
        )}
        {activeTab === 'empresa' && (
          <EmpresaTab
            testimonials={testimonials}
            benefits={benefits}
            faqs={faqs}
            stats={stats}
          />
        )}
      </main>
    </div>
  )
}

// ============================================
// Tab: Inicio (Página Principal)
// ============================================

function InicioTab({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl">
        <span className="material-symbols-outlined text-blue-600 mt-0.5" style={{ fontSize: '22px' }}>info</span>
        <div>
          <p className="text-sm text-blue-800 font-medium">
            Estas secciones aparecen en la página de inicio de midcar.es
          </p>
          <p className="text-sm text-blue-600 mt-0.5">
            Los cambios se reflejan en la web en tiempo real al estar conectada a la misma base de datos.
          </p>
        </div>
      </div>

      {/* Visual Website Flow */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1">
          Secciones de la página de inicio (en orden)
        </h2>

        <div className="space-y-3">
          {homepageSections.map((section, index) => (
            <Link
              key={section.id}
              href={section.href}
              className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              {/* Order Number */}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0",
                section.color
              )}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  {section.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 group-hover:text-[#135bec] transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                  {section.description}
                </p>
              </div>

              {/* Badge count for certain sections */}
              {section.id === 'testimonials' && stats.testimonials > 0 && (
                <span className="px-2.5 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full">
                  {stats.testimonials}
                </span>
              )}
              {section.id === 'benefits' && stats.benefits > 0 && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">
                  {stats.benefits}
                </span>
              )}

              {/* Arrow */}
              <span className="material-symbols-outlined text-slate-300 group-hover:text-[#135bec] transition-colors" style={{ fontSize: '20px' }}>
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Non-editable sections note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>visibility_off</span>
          <div>
            <p className="text-sm font-medium text-slate-600">
              Secciones no editables desde aquí
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Buscador de vehículos, Trust Badges, Vehículos Destacados (se gestionan desde <Link href="/vehiculos" className="text-[#135bec] hover:underline">Vehículos</Link>), y logos de Marcas son dinámicos o están integrados en el código.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Tab: Blog
// ============================================

function BlogTab({
  posts,
  categories,
  stats,
  filters,
  onFilterChange,
  onDelete,
  formatDate,
  getEstadoBadge,
}: {
  posts: BlogPost[]
  categories: BlogCategory[]
  stats: Stats
  filters: { search: string; categoria_id: string; estado: string }
  onFilterChange: (filters: { search: string; categoria_id: string; estado: string }) => void
  onDelete: (id: string, titulo: string) => void
  formatDate: (d: string | null) => string
  getEstadoBadge: (estado: string) => React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total artículos', value: stats.posts, icon: 'article', color: 'blue' },
          { label: 'Publicados', value: stats.published, icon: 'check_circle', color: 'emerald' },
          { label: 'Borradores', value: stats.drafts, icon: 'edit_note', color: 'amber' },
          { label: 'Categorías', value: stats.categories, icon: 'category', color: 'purple' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `bg-${stat.color}-100`)}>
                <span className={cn("material-symbols-outlined", `text-${stat.color}-600`)} style={{ fontSize: '20px' }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Artículos del blog
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/gestion-web/blog/categorias"
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>category</span>
            <span className="hidden sm:inline">Categorías</span>
          </Link>
          <Link
            href="/gestion-web/blog/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Artículo
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.categoria_id}
              onChange={(e) => onFilterChange({ ...filters, categoria_id: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <select
              value={filters.estado}
              onChange={(e) => onFilterChange({ ...filters, estado: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] bg-white text-sm"
            >
              <option value="">Todos</option>
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
              <div key={post.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {post.imagen_principal ? (
                      <img src={post.imagen_principal} alt={post.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '28px' }}>image</span>
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
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1 hidden sm:block">
                          {post.extracto || 'Sin extracto'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/gestion-web/blog/${post.id}`}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>edit</span>
                        </Link>
                        <button
                          onClick={() => onDelete(post.id, post.titulo)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {getEstadoBadge(post.estado)}
                      {post.categoria && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {post.categoria.nombre}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatDate(post.fecha_publicacion || post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 mb-3" style={{ fontSize: '48px' }}>article</span>
            <p className="text-slate-500 mb-4">No hay artículos</p>
            <Link
              href="/gestion-web/blog/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#135bec] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Crear primer artículo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Tab: Empresa & Config
// ============================================

function EmpresaTab({
  testimonials,
  benefits,
  faqs,
  stats,
}: {
  testimonials: WebTestimonial[]
  benefits: WebBenefit[]
  faqs: WebFAQ[]
  stats: Stats
}) {
  const empresaSections = [
    {
      id: 'contact',
      title: 'Información de Contacto',
      description: 'Teléfono, email, dirección, horarios y redes sociales',
      icon: 'contact_phone',
      href: '/gestion-web/contact',
      color: 'from-red-500 to-rose-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      id: 'faqs',
      title: 'Preguntas Frecuentes',
      description: 'FAQs de financiación, garantía y generales',
      icon: 'help',
      href: '/gestion-web/faqs',
      color: 'from-cyan-500 to-teal-600',
      bgLight: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      count: stats.faqs,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Testimonios activos', value: testimonials.filter(t => t.activo).length, total: stats.testimonials, icon: 'rate_review', color: 'pink' },
          { label: 'Beneficios activos', value: benefits.filter(b => b.activo).length, total: stats.benefits, icon: 'verified', color: 'amber' },
          { label: 'FAQs activas', value: faqs.filter(f => f.activo).length, total: stats.faqs, icon: 'help', color: 'cyan' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `bg-${stat.color}-100`)}>
                <span className={cn("material-symbols-outlined", `text-${stat.color}-600`)} style={{ fontSize: '20px' }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}<span className="text-sm font-normal text-slate-400">/{stat.total}</span></p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1">
          Configuración de la empresa
        </h2>
        <div className="space-y-3">
          {empresaSections.map(section => (
            <Link
              key={section.id}
              href={section.href}
              className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0",
                section.color
              )}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  {section.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 group-hover:text-[#135bec] transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
              </div>
              {section.count !== undefined && section.count > 0 && (
                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", section.bgLight, section.textColor)}>
                  {section.count}
                </span>
              )}
              <span className="material-symbols-outlined text-slate-300 group-hover:text-[#135bec] transition-colors" style={{ fontSize: '20px' }}>
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Testimonials Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            Testimonios recientes
          </h2>
          <Link
            href="/gestion-web/testimonials"
            className="text-sm text-[#135bec] hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Ver todos
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testimonials.slice(0, 4).map(t => (
              <div key={t.id} className={cn("bg-white rounded-xl border border-slate-200 p-4", !t.activo && "opacity-50")}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-900 text-sm">{t.nombre}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={cn("text-xs", s <= t.rating ? "text-yellow-400" : "text-slate-200")}>
                        ★
                      </span>
                    ))}
                  </div>
                  {!t.activo && <span className="text-xs text-slate-400 ml-auto">Oculto</span>}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{t.texto}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">No hay testimonios</p>
          </div>
        )}
      </div>

      {/* Benefits Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            Beneficios / Ventajas
          </h2>
          <Link
            href="/gestion-web/benefits"
            className="text-sm text-[#135bec] hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Gestionar
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {benefits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map(b => (
              <div key={b.id} className={cn("bg-white rounded-xl border border-slate-200 p-4", !b.activo && "opacity-50")}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '20px' }}>
                      {b.icono || 'check_circle'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-1">{b.titulo}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{b.descripcion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">No hay beneficios</p>
          </div>
        )}
      </div>
    </div>
  )
}
