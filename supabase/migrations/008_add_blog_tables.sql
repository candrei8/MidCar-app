-- ============================================================================
-- BLOG TABLES - Sistema de Blog para MidCar
-- ============================================================================

-- Categorías del blog
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artículos del blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(300) UNIQUE NOT NULL,
  titulo VARCHAR(300) NOT NULL,
  extracto TEXT,
  contenido TEXT NOT NULL,
  imagen_principal VARCHAR(500),
  categoria_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  autor VARCHAR(100) DEFAULT 'MID Car',
  tags JSONB DEFAULT '[]',

  -- SEO
  seo_titulo VARCHAR(70),
  seo_descripcion VARCHAR(160),
  seo_keywords TEXT,

  -- Estado
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  destacado BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,

  -- Fechas
  fecha_publicacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  created_by_name VARCHAR(100)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON blog_posts(categoria_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_estado ON blog_posts(estado);
CREATE INDEX IF NOT EXISTS idx_blog_posts_fecha ON blog_posts(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_destacado ON blog_posts(destacado) WHERE destacado = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_activo ON blog_categories(activo) WHERE activo = true;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en blog_categories
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_posts: lectura pública, escritura autenticada
DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_posts_auth_insert" ON blog_posts;
CREATE POLICY "blog_posts_auth_insert" ON blog_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "blog_posts_auth_update" ON blog_posts;
CREATE POLICY "blog_posts_auth_update" ON blog_posts
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "blog_posts_auth_delete" ON blog_posts;
CREATE POLICY "blog_posts_auth_delete" ON blog_posts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para blog_categories: lectura pública, escritura autenticada
DROP POLICY IF EXISTS "blog_categories_public_read" ON blog_categories;
CREATE POLICY "blog_categories_public_read" ON blog_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "blog_categories_auth_insert" ON blog_categories;
CREATE POLICY "blog_categories_auth_insert" ON blog_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "blog_categories_auth_update" ON blog_categories;
CREATE POLICY "blog_categories_auth_update" ON blog_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "blog_categories_auth_delete" ON blog_categories;
CREATE POLICY "blog_categories_auth_delete" ON blog_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- DATOS INICIALES - CATEGORÍAS
-- ============================================================================

INSERT INTO blog_categories (nombre, slug, descripcion, orden) VALUES
('Compra de Coches', 'compra-coches', 'Guías y consejos para comprar coches de segunda mano de forma segura e inteligente', 1),
('Mantenimiento', 'mantenimiento', 'Consejos de mantenimiento y cuidado del vehículo para alargar su vida útil', 2),
('Financiación', 'financiacion', 'Todo sobre financiación, formas de pago y opciones de crédito para tu vehículo', 3),
('Noticias del Motor', 'noticias', 'Últimas noticias del sector automovilístico, novedades y tendencias', 4),
('Guías de Modelos', 'guias-modelos', 'Análisis detallados y opiniones de modelos específicos de coches', 5),
('Furgonetas', 'furgonetas', 'Todo sobre furgonetas y vehículos comerciales para tu negocio', 6),
('Coches Híbridos y Eléctricos', 'hibridos-electricos', 'Vehículos ecológicos, híbridos y eléctricos: ventajas y guías de compra', 7),
('Normativa y ITV', 'normativa-itv', 'Información sobre normativa de tráfico, ITV, documentación y trámites', 8)
ON CONFLICT (slug) DO NOTHING;
