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
    gradient: 'from-red-500 to-rose-600',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    id: 'benefits',
    title: 'Beneficios / Ventajas',
    description: 'Tarjetas con las ventajas de comprar en MID Car',
    icon: 'verified',
    href: '/gestion-web/benefits',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'about',
    title: 'Sobre Nosotros',
    description: 'Historia, párrafos descriptivos, estadísticas e imagen',
    icon: 'info',
    href: '/gestion-web/about',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'warranty',
    title: 'Garantía',
    description: 'Información de garantía: qué cubre y qué no cubre',
    icon: 'shield',
    href: '/gestion-web/warranty',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    id: 'testimonials',
    title: 'Testimonios',
    description: 'Opiniones y valoraciones de clientes reales',
    icon: 'rate_review',
    href: '/gestion-web/testimonials',
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    id: 'cta',
    title: 'Llamadas a la Acción',
    description: 'Secciones de financiación, coche a la carta y contacto',
    icon: 'ads_click',
    href: '/gestion-web/cta',
    gradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
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
      publicado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      borrador: 'bg-amber-100 text-amber-700 border border-amber-200',
      archivado: 'bg-slate-100 text-slate-600 border border-slate-200',
    }
    const labels: Record<string, string> = {
      publicado: 'Publicado',
      borrador: 'Borrador',
      archivado: 'Archivado',
    }
    return (
      <span className={cn("px-2.5 py-0.5 text-xs rounded-full font-semibold", styles[estado])}>
        {labels[estado]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-red-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 font-medium">Cargando panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>language</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                  Gestión Web
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edita el contenido de midcar.es en tiempo real
                </p>
              </div>
            </div>
            <a
              href="https://www.midcar.es"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium transition-all text-sm hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
              <span className="hidden sm:inline">Ver web</span>
            </a>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 px-4 md:px-6 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-[3px] transition-all",
                  activeTab === tab.id
                    ? "border-red-600 text-red-600 bg-red-50/60"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
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
      {/* Info Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 shadow-sm p-5 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(220,38,38,0.08),transparent_50%)]"></div>
        <div className="relative flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-red-100 shadow-sm flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-600" style={{ fontSize: '22px' }}>tips_and_updates</span>
          </div>
          <div>
            <p className="text-sm text-slate-900 font-semibold">
              Panel de contenido web
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Los cambios se reflejan en midcar.es en tiempo real al estar conectada a la misma base de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Secciones de la página de inicio</h2>
          <p className="text-sm text-slate-500 mt-0.5">Editables en orden de aparición</p>
        </div>
        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
          {homepageSections.length} secciones
        </span>
      </div>

      {/* Visual Website Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homepageSections.map((section, index) => (
          <Link
            key={section.id}
            href={section.href}
            className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {/* Order + Icon */}
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg",
                  section.gradient
                )}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {section.icon}
                  </span>
                </div>
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-slate-700 text-[10px] font-bold flex items-center justify-center border border-slate-200 shadow-sm">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {section.description}
                </p>
              </div>

              {/* Badge count */}
              {section.id === 'testimonials' && stats.testimonials > 0 && (
                <span className="px-2.5 py-1 bg-pink-50 text-pink-600 text-xs font-bold rounded-full border border-pink-100">
                  {stats.testimonials}
                </span>
              )}
              {section.id === 'benefits' && stats.benefits > 0 && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full border border-amber-100">
                  {stats.benefits}
                </span>
              )}
            </div>

            {/* Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-slate-300 group-hover:text-red-600 transition-colors" style={{ fontSize: '18px' }}>
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Non-editable sections note */}
      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>info</span>
          <div>
            <p className="text-sm font-medium text-slate-600">Secciones dinámicas</p>
            <p className="text-xs text-slate-400 mt-1">
              Buscador, Trust Badges, Vehículos Destacados y Marcas se gestionan desde{' '}
              <Link href="/inventario" className="text-red-600 hover:underline font-medium">Inventario</Link>.
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
          { label: 'Total artículos', value: stats.posts, icon: 'article', bg: 'bg-red-50', iconColor: 'text-red-600', borderColor: 'border-red-100' },
          { label: 'Publicados', value: stats.published, icon: 'check_circle', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', borderColor: 'border-emerald-100' },
          { label: 'Borradores', value: stats.drafts, icon: 'edit_note', bg: 'bg-amber-50', iconColor: 'text-amber-600', borderColor: 'border-amber-100' },
          { label: 'Categorías', value: stats.categories, icon: 'category', bg: 'bg-violet-50', iconColor: 'text-violet-600', borderColor: 'border-violet-100' },
        ].map(stat => (
          <div key={stat.label} className={cn("rounded-2xl border p-4", stat.bg, stat.borderColor)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                <span className={cn("material-symbols-outlined", stat.iconColor)} style={{ fontSize: '22px' }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Artículos del blog
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/gestion-web/blog/categorias"
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all text-sm border border-slate-200 hover:border-slate-300"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>category</span>
            <span className="hidden sm:inline">Categorías</span>
          </Link>
          <Link
            href="/gestion-web/blog/nuevo"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Nuevo Artículo
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '20px' }}>search</span>
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.categoria_id}
              onChange={(e) => onFilterChange({ ...filters, categoria_id: e.target.value })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <select
              value={filters.estado}
              onChange={(e) => onFilterChange({ ...filters, estado: e.target.value })}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {posts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4 md:p-5 hover:bg-slate-50/60 transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
                    {post.imagen_principal ? (
                      <img src={post.imagen_principal} alt={post.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '32px' }}>image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-red-600 transition-colors">{post.titulo}</h3>
                          {post.destacado && (
                            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '16px' }}>star</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1 hidden sm:block">
                          {post.extracto || 'Sin extracto'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/gestion-web/blog/${post.id}`}
                          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-slate-400 hover:text-red-600" style={{ fontSize: '18px' }}>edit</span>
                        </Link>
                        <button
                          onClick={() => onDelete(post.id, post.titulo)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-slate-400 hover:text-red-600" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {getEstadoBadge(post.estado)}
                      {post.categoria && (
                        <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 text-xs rounded-full font-medium border border-sky-100">
                          {post.categoria.nombre}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDate(post.fecha_publicacion || post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '32px' }}>article</span>
            </div>
            <p className="text-slate-600 font-medium mb-1">No hay artículos</p>
            <p className="text-sm text-slate-400 mb-6">Crea tu primer artículo para el blog de MID Car</p>
            <Link
              href="/gestion-web/blog/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all text-sm hover:-translate-y-0.5 hover:shadow-lg"
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
      gradient: 'from-red-500 to-rose-600',
    },
    {
      id: 'faqs',
      title: 'Preguntas Frecuentes',
      description: 'FAQs de financiación, garantía y generales',
      icon: 'help',
      href: '/gestion-web/faqs',
      gradient: 'from-cyan-500 to-teal-600',
      count: stats.faqs,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Testimonios activos', value: testimonials.filter(t => t.activo).length, total: stats.testimonials, icon: 'rate_review', bg: 'bg-pink-50', iconColor: 'text-pink-600', borderColor: 'border-pink-100' },
          { label: 'Beneficios activos', value: benefits.filter(b => b.activo).length, total: stats.benefits, icon: 'verified', bg: 'bg-amber-50', iconColor: 'text-amber-600', borderColor: 'border-amber-100' },
          { label: 'FAQs activas', value: faqs.filter(f => f.activo).length, total: stats.faqs, icon: 'help', bg: 'bg-cyan-50', iconColor: 'text-cyan-600', borderColor: 'border-cyan-100' },
        ].map(stat => (
          <div key={stat.label} className={cn("rounded-2xl border p-4", stat.bg, stat.borderColor)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                <span className={cn("material-symbols-outlined", stat.iconColor)} style={{ fontSize: '22px' }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}<span className="text-sm font-normal text-slate-400">/{stat.total}</span>
                </p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Configuración de la empresa</h2>
        <div className="space-y-3">
          {empresaSections.map(section => (
            <Link
              key={section.id}
              href={section.href}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0 shadow-lg",
                section.gradient
              )}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {section.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
              </div>
              {section.count !== undefined && section.count > 0 && (
                <span className="px-2.5 py-1 bg-cyan-50 text-cyan-600 text-xs font-bold rounded-full border border-cyan-100">
                  {section.count}
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-slate-300 group-hover:text-red-600 transition-colors" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Testimonials Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Testimonios recientes</h2>
          <Link
            href="/gestion-web/testimonials"
            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
          >
            Ver todos
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testimonials.slice(0, 4).map(t => (
              <div key={t.id} className={cn("bg-white rounded-2xl border border-slate-200/80 p-4 transition-opacity", !t.activo && "opacity-50")}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold flex items-center justify-center">
                    {t.nombre.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">{t.nombre}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={cn("text-xs", s <= t.rating ? "text-amber-400" : "text-slate-200")}>
                        ★
                      </span>
                    ))}
                  </div>
                  {!t.activo && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Oculto</span>}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{t.texto}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <p className="text-sm text-slate-500">No hay testimonios</p>
          </div>
        )}
      </div>

      {/* Benefits Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Beneficios / Ventajas</h2>
          <Link
            href="/gestion-web/benefits"
            className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
          >
            Gestionar
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {benefits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map(b => (
              <div key={b.id} className={cn("bg-white rounded-2xl border border-slate-200/80 p-4 transition-opacity", !b.activo && "opacity-50")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '20px' }}>
                      {b.icono || 'check_circle'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{b.titulo}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{b.descripcion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <p className="text-sm text-slate-500">No hay beneficios</p>
          </div>
        )}
      </div>
    </div>
  )
}
