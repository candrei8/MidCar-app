-- Migration: Add Web Content Tables for CMS/Back-office
-- Date: 2026-01-24
-- Description: Tables to manage website content from the dashboard

-- ============================================
-- Table: web_content (Generic content sections)
-- ============================================
CREATE TABLE IF NOT EXISTS web_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion VARCHAR(50) NOT NULL,
  clave VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'text',
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seccion, clave)
);

-- ============================================
-- Table: web_testimonials (Customer reviews)
-- ============================================
CREATE TABLE IF NOT EXISTS web_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  fecha VARCHAR(50),
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  texto TEXT NOT NULL,
  imagen_url VARCHAR(500),
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: web_faqs (Frequently Asked Questions)
-- ============================================
CREATE TABLE IF NOT EXISTS web_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion VARCHAR(50) DEFAULT 'general',
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: web_benefits (Why choose us)
-- ============================================
CREATE TABLE IF NOT EXISTS web_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  icono VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: web_config (Global settings)
-- ============================================
CREATE TABLE IF NOT EXISTS web_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'text',
  descripcion VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_web_content_updated_at
  BEFORE UPDATE ON web_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web_testimonials_updated_at
  BEFORE UPDATE ON web_testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web_faqs_updated_at
  BEFORE UPDATE ON web_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web_benefits_updated_at
  BEFORE UPDATE ON web_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web_config_updated_at
  BEFORE UPDATE ON web_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE web_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_config ENABLE ROW LEVEL SECURITY;

-- Public read access (for the website)
CREATE POLICY "Public read web_content" ON web_content FOR SELECT USING (true);
CREATE POLICY "Public read web_testimonials" ON web_testimonials FOR SELECT USING (true);
CREATE POLICY "Public read web_faqs" ON web_faqs FOR SELECT USING (true);
CREATE POLICY "Public read web_benefits" ON web_benefits FOR SELECT USING (true);
CREATE POLICY "Public read web_config" ON web_config FOR SELECT USING (true);

-- Authenticated users can modify (for the dashboard)
CREATE POLICY "Auth insert web_content" ON web_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update web_content" ON web_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete web_content" ON web_content FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert web_testimonials" ON web_testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update web_testimonials" ON web_testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete web_testimonials" ON web_testimonials FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert web_faqs" ON web_faqs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update web_faqs" ON web_faqs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete web_faqs" ON web_faqs FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert web_benefits" ON web_benefits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update web_benefits" ON web_benefits FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete web_benefits" ON web_benefits FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth insert web_config" ON web_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update web_config" ON web_config FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete web_config" ON web_config FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Initial Data: Configuration
-- ============================================
INSERT INTO web_config (clave, valor, tipo, descripcion) VALUES
  ('telefono', '910 023 016', 'text', 'Teléfono principal'),
  ('whatsapp', '695055555', 'text', 'Número de WhatsApp'),
  ('email', 'ventas@midcar.net', 'text', 'Email de contacto'),
  ('direccion_calle', 'C/ Polo Sur 2', 'text', 'Dirección - calle'),
  ('direccion_cp', '28850', 'text', 'Código postal'),
  ('direccion_ciudad', 'Torrejón de Ardoz', 'text', 'Ciudad'),
  ('direccion_provincia', 'Madrid', 'text', 'Provincia'),
  ('horario_lunes_jueves', '9:00-14:00 / 16:00-20:30', 'text', 'Horario L-J'),
  ('horario_viernes', '9:00-17:00', 'text', 'Horario viernes'),
  ('horario_sabado', 'Cerrado', 'text', 'Horario sábado'),
  ('horario_domingo', '11:00-14:00', 'text', 'Horario domingo'),
  ('google_maps_url', 'https://goo.gl/maps/QBEDPvLewMC1NdZ68', 'text', 'URL Google Maps'),
  ('facebook_url', 'https://www.facebook.com/midcar.midcar/', 'text', 'Facebook'),
  ('instagram_url', 'https://www.instagram.com/midcarmidcar/', 'text', 'Instagram'),
  ('youtube_url', 'https://www.youtube.com/@mid7473', 'text', 'YouTube'),
  ('twitter_url', 'https://twitter.com/MidcarVehiculos', 'text', 'Twitter'),
  ('ano_fundacion', '2009', 'number', 'Año de fundación'),
  ('google_rating', '4.5', 'number', 'Valoración en Google'),
  ('google_reviews_count', '189', 'number', 'Número de reseñas en Google'),
  ('garantia_meses', '12', 'number', 'Meses de garantía'),
  ('tae_financiacion', '7.99', 'number', 'TAE de financiación (%)'),
  ('max_por_averia', '2500', 'number', 'Máximo por avería (€)')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ============================================
-- Initial Data: Hero Section
-- ============================================
INSERT INTO web_content (seccion, clave, valor, tipo, orden) VALUES
  ('hero', 'badge', 'Concesionario de confianza en Madrid', 'text', 1),
  ('hero', 'titulo_1', 'Tu próximo coche', 'text', 2),
  ('hero', 'titulo_2', 'está aquí', 'text', 3),
  ('hero', 'subtitulo', 'Más de 15 años ofreciendo vehículos de ocasión certificados, garantizados y al mejor precio en Torrejón de Ardoz, Madrid.', 'text', 4),
  ('hero', 'cta_primario', 'Ver vehículos', 'text', 5),
  ('hero', 'cta_secundario', 'Contactar', 'text', 6),
  ('hero', 'stat_1_valor', '15+', 'text', 7),
  ('hero', 'stat_1_label', 'años de experiencia', 'text', 8),
  ('hero', 'stat_2_valor', '1 año', 'text', 9),
  ('hero', 'stat_2_label', 'de garantía', 'text', 10),
  ('hero', 'stat_3_valor', '80+', 'text', 11),
  ('hero', 'stat_3_label', 'vehículos en stock', 'text', 12),
  ('hero', 'precio_desde', '7.900€', 'text', 13),
  ('hero', 'garantia_badge', 'Garantía 12 meses', 'text', 14),
  ('hero', 'imagen_url', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80', 'image', 15)
ON CONFLICT (seccion, clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ============================================
-- Initial Data: About Section
-- ============================================
INSERT INTO web_content (seccion, clave, valor, tipo, orden) VALUES
  ('about', 'label', 'Sobre nosotros', 'text', 1),
  ('about', 'titulo', 'Tu concesionario de confianza en Madrid', 'text', 2),
  ('about', 'parrafo_principal', 'En MID Car contamos con una amplia experiencia de más de 10 años en la venta de vehículos de ocasión. Sabemos que comprar un coche es una inversión importante y trabajamos con la única intención de conseguir que cada cliente esté al 100% satisfecho con su compra.', 'text', 3),
  ('about', 'parrafo_2', 'Somos un concesionario de compraventa de vehículos de ocasión certificados situado en Torrejón de Ardoz, Madrid. Nuestro compromiso es ofrecer vehículos de calidad con total transparencia.', 'text', 4),
  ('about', 'parrafo_3', 'Nuestros vehículos están garantizados y revisados. Colaboramos con CONCENTRA GARANTÍAS para ofrecer hasta 1 año de garantía sin límite de kilómetros.', 'text', 5),
  ('about', 'parrafo_4', 'Somos miembros de GANVAM desde 2010 y Concesionario Avanzado CARFAX, lo que significa que todos nuestros vehículos incluyen el informe de historial CARFAX gratuitamente.', 'text', 6),
  ('about', 'parrafo_5', 'Llevamos en Torrejón de Ardoz ejerciendo nuestra actividad desde el año 2009, siendo referentes en el sector por nuestra profesionalidad y trato cercano.', 'text', 7),
  ('about', 'stat_1_valor', '+80', 'text', 8),
  ('about', 'stat_1_label', 'Vehículos en stock', 'text', 9),
  ('about', 'stat_2_valor', '4.5', 'text', 10),
  ('about', 'stat_2_label', 'Estrellas en Google', 'text', 11),
  ('about', 'stat_3_valor', '2009', 'text', 12),
  ('about', 'stat_3_label', 'Desde', 'text', 13),
  ('about', 'stat_4_valor', '2', 'text', 14),
  ('about', 'stat_4_label', 'Ubicaciones', 'text', 15),
  ('about', 'imagen_url', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80', 'image', 16)
ON CONFLICT (seccion, clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ============================================
-- Initial Data: Warranty Section
-- ============================================
INSERT INTO web_content (seccion, clave, valor, tipo, orden) VALUES
  ('warranty', 'titulo', '1 año de garantía sin límite de km', 'text', 1),
  ('warranty', 'subtitulo', 'Colaboramos con CONCENTRA GARANTÍAS desde hace más de 11 años. Los seguros que nos ofrecen cubren, a nivel europeo, el doble de elementos mecánicos que nuestra competencia. Además, la garantía cubre hasta 2.500€ por avería, 4 veces más que la garantía usual.', 'text', 2),
  ('warranty', 'cubierto_1', 'Motor y sus componentes internos', 'text', 10),
  ('warranty', 'cubierto_2', 'Caja de cambios manual y automática', 'text', 11),
  ('warranty', 'cubierto_3', 'Sistema de dirección', 'text', 12),
  ('warranty', 'cubierto_4', 'Sistema de frenos (ABS, servofreno)', 'text', 13),
  ('warranty', 'cubierto_5', 'Sistema de refrigeración', 'text', 14),
  ('warranty', 'cubierto_6', 'Sistema eléctrico del motor', 'text', 15),
  ('warranty', 'cubierto_7', 'Embrague y volante bimasa', 'text', 16),
  ('warranty', 'cubierto_8', 'Turbocompresor', 'text', 17),
  ('warranty', 'cubierto_9', 'Sistema de inyección', 'text', 18),
  ('warranty', 'cubierto_10', 'Diferencial y transmisión', 'text', 19),
  ('warranty', 'no_cubierto_1', 'Elementos de desgaste (pastillas, discos, neumáticos)', 'text', 20),
  ('warranty', 'no_cubierto_2', 'Mantenimiento periódico (aceite, filtros)', 'text', 21),
  ('warranty', 'no_cubierto_3', 'Carrocería y pintura', 'text', 22),
  ('warranty', 'no_cubierto_4', 'Tapicería e interior', 'text', 23),
  ('warranty', 'no_cubierto_5', 'Cristales y lunas', 'text', 24),
  ('warranty', 'no_cubierto_6', 'Daños por accidente o mal uso', 'text', 25)
ON CONFLICT (seccion, clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ============================================
-- Initial Data: CTA Section
-- ============================================
INSERT INTO web_content (seccion, clave, valor, tipo, orden) VALUES
  ('cta', 'financiacion_badge', 'Financiación flexible', 'text', 1),
  ('cta', 'financiacion_titulo', 'Financiación a tu medida', 'text', 2),
  ('cta', 'financiacion_descripcion', 'Te ayudamos a financiar el 100% del valor de tu coche, sin entrada y hasta en 10 años. Calculamos tu cuota en minutos.', 'text', 3),
  ('cta', 'financiacion_boton', 'Calcular mi financiación', 'text', 4),
  ('cta', 'coche_carta_badge', 'Coche a la carta', 'text', 5),
  ('cta', 'coche_carta_titulo', '¿No encuentras lo que buscas?', 'text', 6),
  ('cta', 'coche_carta_descripcion', 'Nosotros te lo encontramos al mejor precio. Dinos qué coche necesitas y lo buscaremos por ti.', 'text', 7),
  ('cta', 'coche_carta_boton', 'Solicitar coche', 'text', 8),
  ('cta', 'contacto_titulo', '¿Tienes alguna duda?', 'text', 9),
  ('cta', 'contacto_subtitulo', 'Estamos aquí para ayudarte. Contáctanos sin compromiso.', 'text', 10)
ON CONFLICT (seccion, clave) DO UPDATE SET valor = EXCLUDED.valor;

-- ============================================
-- Initial Data: Benefits
-- ============================================
INSERT INTO web_benefits (titulo, descripcion, icono, orden) VALUES
  ('Vehículos de confianza', 'Todos nuestros coches son certificados, garantizados, revisados y disponen gratis del informe CARFAX.', 'shield-check', 1),
  ('1 año de garantía', 'Garantía sin límite de kilómetros. Colaboramos con CONCENTRA GARANTÍAS desde hace más de 11 años.', 'award', 2),
  ('Concesionario familiar', 'Equipo pequeño pero ágil de profesionales altamente cualificados y dispuestos a guiarte.', 'users', 3),
  ('Transparencia total', 'Más de 10 años de experiencia. Sabemos que comprar un coche usado requiere confianza.', 'eye', 4),
  ('Tu coche como pago', 'Si quieres cambiar tu coche actual por uno de ocasión, tasamos tu vehículo como parte de pago.', 'refresh-cw', 5),
  ('Gestiones rápidas', 'Preparamos todos los papeles para que con una sola firma tengas todo listo.', 'file-text', 6);

-- ============================================
-- Initial Data: Testimonials
-- ============================================
INSERT INTO web_testimonials (nombre, fecha, rating, texto, orden) VALUES
  ('Carlos M.', 'Hace 2 meses', 5, 'Compré un Ford Focus y todo fue perfecto. El coche estaba impecable y el trato fue inmejorable. Muy recomendable.', 1),
  ('María G.', 'Hace 3 meses', 5, 'Después de buscar en varios concesionarios, encontré en MID Car el coche que buscaba al mejor precio. La financiación fue muy sencilla.', 2),
  ('Antonio R.', 'Hace 4 meses', 5, 'Viajé desde Ávila para comprar un coche y valió la pena. Profesionales de verdad, te asesoran sin presiones.', 3);

-- ============================================
-- Initial Data: FAQs Financiación
-- ============================================
INSERT INTO web_faqs (seccion, pregunta, respuesta, orden) VALUES
  ('financiacion', '¿Qué documentación necesito?', 'DNI/NIE en vigor, última nómina o declaración de la renta, y justificante de domicilio. Para autónomos, además el último modelo trimestral de IVA.', 1),
  ('financiacion', '¿Puedo financiar sin entrada?', 'Sí, ofrecemos financiación hasta el 100% del valor del vehículo. La aprobación depende del estudio de viabilidad.', 2),
  ('financiacion', '¿Cuánto tarda la aprobación?', 'Normalmente la respuesta es en menos de 24 horas hábiles. En muchos casos, podemos darte una respuesta preliminar en el momento.', 3),
  ('financiacion', '¿Puedo cancelar anticipadamente?', 'Sí, puedes cancelar tu financiación en cualquier momento sin penalización. Solo pagarás los intereses generados hasta la fecha de cancelación.', 4);

-- ============================================
-- Indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_web_content_seccion ON web_content(seccion);
CREATE INDEX IF NOT EXISTS idx_web_content_activo ON web_content(activo);
CREATE INDEX IF NOT EXISTS idx_web_testimonials_activo ON web_testimonials(activo);
CREATE INDEX IF NOT EXISTS idx_web_faqs_seccion ON web_faqs(seccion);
CREATE INDEX IF NOT EXISTS idx_web_faqs_activo ON web_faqs(activo);
CREATE INDEX IF NOT EXISTS idx_web_benefits_activo ON web_benefits(activo);
CREATE INDEX IF NOT EXISTS idx_web_config_clave ON web_config(clave);
