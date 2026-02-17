import { supabase, isSupabaseConfigured } from './supabase'

// ============================================================================
// TIPOS
// ============================================================================

export interface BlogCategory {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen_url: string | null
  orden: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  slug: string
  titulo: string
  extracto: string | null
  contenido: string
  imagen_principal: string | null
  categoria_id: string | null
  autor: string
  tags: string[]
  seo_titulo: string | null
  seo_descripcion: string | null
  seo_keywords: string | null
  estado: 'borrador' | 'publicado' | 'archivado'
  destacado: boolean
  orden: number
  fecha_publicacion: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  created_by_name: string | null
  // Joined
  categoria?: BlogCategory
}

export interface BlogPostFilters {
  categoria_id?: string
  estado?: string
  destacado?: boolean
  search?: string
}

// ============================================================================
// CATEGORÍAS
// ============================================================================

export async function getBlogCategories(): Promise<BlogCategory[]> {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('orden', { ascending: true })

  if (error) {
    console.error('Error fetching blog categories:', error)
    return []
  }

  return data || []
}

export async function getBlogCategoryById(id: string): Promise<BlogCategory | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching blog category:', error)
    return null
  }

  return data
}

export async function createBlogCategory(category: Omit<BlogCategory, 'id' | 'created_at' | 'updated_at'>): Promise<BlogCategory | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    console.error('Error creating blog category:', error)
    return null
  }

  return data
}

export async function updateBlogCategory(id: string, updates: Partial<BlogCategory>): Promise<BlogCategory | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating blog category:', error)
    return null
  }

  return data
}

export async function deleteBlogCategory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting blog category:', error)
    return false
  }

  return true
}

// ============================================================================
// POSTS
// ============================================================================

export async function getBlogPosts(filters?: BlogPostFilters): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return []

  let query = supabase
    .from('blog_posts')
    .select(`
      *,
      categoria:blog_categories(*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.categoria_id) {
    query = query.eq('categoria_id', filters.categoria_id)
  }

  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters?.destacado !== undefined) {
    query = query.eq('destacado', filters.destacado)
  }

  if (filters?.search) {
    query = query.or(`titulo.ilike.%${filters.search}%,extracto.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return data || []
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      categoria:blog_categories(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    return null
  }

  return data
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      categoria:blog_categories(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching blog post by slug:', error)
    return null
  }

  return data
}

export async function createBlogPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'categoria'>): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select(`
      *,
      categoria:blog_categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating blog post:', error)
    return null
  }

  return data
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null

  // Remove joined fields before update
  const { categoria, ...cleanUpdates } = updates

  const { data, error } = await supabase
    .from('blog_posts')
    .update(cleanUpdates)
    .eq('id', id)
    .select(`
      *,
      categoria:blog_categories(*)
    `)
    .single()

  if (error) {
    console.error('Error updating blog post:', error)
    return null
  }

  return data
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting blog post:', error)
    return false
  }

  return true
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-|-$/g, '') // Trim - from start/end
    .substring(0, 100) // Limit length
}

export async function getBlogPostsCount(estado?: string): Promise<number> {
  if (!isSupabaseConfigured) return 0

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })

  if (estado) {
    query = query.eq('estado', estado)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error counting blog posts:', error)
    return 0
  }

  return count || 0
}

export async function getBlogCategoriesCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0

  const { count, error } = await supabase
    .from('blog_categories')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  if (error) {
    console.error('Error counting blog categories:', error)
    return 0
  }

  return count || 0
}
