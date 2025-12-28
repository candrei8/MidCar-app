// Etiquetas DGT
export const ETIQUETAS_DGT = [
    { value: '0', label: 'Cero Emisiones', color: '#3b82f6' },
    { value: 'ECO', label: 'ECO', color: '#22c55e' },
    { value: 'C', label: 'C', color: '#22c55e' },
    { value: 'B', label: 'B', color: '#eab308' },
    { value: 'SIN', label: 'Sin etiqueta', color: '#6b7280' },
] as const

// Estados de vehículo
export const ESTADOS_VEHICULO = [
    { value: 'disponible', label: 'Disponible', color: '#10b981' },
    { value: 'reservado', label: 'Reservado', color: '#f59e0b' },
    { value: 'vendido', label: 'Vendido', color: '#6b7280' },
    { value: 'taller', label: 'En Taller', color: '#ef4444' },
    { value: 'baja', label: 'Baja', color: '#374151' },
] as const

// Estados de lead
export const ESTADOS_LEAD = [
    { value: 'nuevo', label: 'Nuevo', color: '#dc2626' },
    { value: 'contactado', label: 'Contactado', color: '#f59e0b' },
    { value: 'visita_agendada', label: 'Visita Agendada', color: '#3b82f6' },
    { value: 'prueba_conduccion', label: 'Prueba Conducción', color: '#8b5cf6' },
    { value: 'propuesta_enviada', label: 'Propuesta Enviada', color: '#06b6d4' },
    { value: 'negociacion', label: 'Negociación', color: '#d946ef' },
    { value: 'vendido', label: 'Vendido', color: '#10b981' },
    { value: 'perdido', label: 'Perdido', color: '#6b7280' },
] as const

// Prioridades de lead
export const PRIORIDADES_LEAD = [
    { value: 'baja', label: 'Baja', color: '#6b7280' },
    { value: 'media', label: 'Media', color: '#3b82f6' },
    { value: 'alta', label: 'Alta', color: '#f59e0b' },
    { value: 'urgente', label: 'Urgente', color: '#ef4444' },
] as const

// Tipos de combustible
export const COMBUSTIBLES = [
    { value: 'gasolina', label: 'Gasolina' },
    { value: 'diesel', label: 'Diésel' },
    { value: 'hibrido', label: 'Híbrido' },
    { value: 'electrico', label: 'Eléctrico' },
    { value: 'glp', label: 'GLP' },
    { value: 'gnc', label: 'GNC' },
] as const

// Tipos de transmisión
export const TRANSMISIONES = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatico', label: 'Automático' },
    { value: 'semiautomatico', label: 'Semiautomático' },
] as const

// Tipos de carrocería
export const CARROCERIAS = [
    { value: 'berlina', label: 'Berlina' },
    { value: 'familiar', label: 'Familiar' },
    { value: 'suv', label: 'SUV' },
    { value: 'monovolumen', label: 'Monovolumen' },
    { value: 'coupe', label: 'Coupé' },
    { value: 'cabrio', label: 'Cabrio' },
    { value: 'industrial', label: 'Industrial' },
] as const

// Marcas de coches
export const MARCAS = [
    'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai',
    'Kia', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault',
    'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
] as const

// Roles de usuario
export const ROLES_USUARIO = [
    { value: 'admin', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor' },
    { value: 'mecanico', label: 'Mecánico' },
    { value: 'recepcionista', label: 'Recepcionista' },
] as const

// Tipos de interacción
export const TIPOS_INTERACCION = [
    { value: 'llamada', label: 'Llamada telefónica', icon: 'Phone' },
    { value: 'email', label: 'Email', icon: 'Mail' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
    { value: 'visita', label: 'Visita presencial', icon: 'MapPin' },
    { value: 'prueba', label: 'Prueba de conducción', icon: 'Car' },
    { value: 'nota', label: 'Nota interna', icon: 'StickyNote' },
] as const

// Sentimientos IA
export const SENTIMIENTOS = [
    { value: 'positivo', label: 'Positivo', color: '#10b981', icon: 'SmilePlus' },
    { value: 'neutral', label: 'Neutral', color: '#6b7280', icon: 'Meh' },
    { value: 'negativo', label: 'Negativo', color: '#ef4444', icon: 'Frown' },
] as const

// Orígenes de contacto
export const ORIGENES_CONTACTO = [
    { value: 'web', label: 'Página Web', icon: 'Globe' },
    { value: 'telefono', label: 'Teléfono', icon: 'Phone' },
    { value: 'presencial', label: 'En Persona', icon: 'UserCheck' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
    { value: 'coches_net', label: 'Coches.net', icon: 'ExternalLink' },
    { value: 'wallapop', label: 'Wallapop', icon: 'ExternalLink' },
    { value: 'autocasion', label: 'Autocasión', icon: 'ExternalLink' },
    { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
    { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
    { value: 'referido', label: 'Referido', icon: 'Users' },
    { value: 'otro', label: 'Otro', icon: 'MoreHorizontal' },
] as const

// Estados de contacto
export const ESTADOS_CONTACTO = [
    { value: 'nuevo', label: 'Nuevo', color: '#dc2626' },
    { value: 'en_seguimiento', label: 'En Seguimiento', color: '#f59e0b' },
    { value: 'convertido_lead', label: 'Convertido a Lead', color: '#10b981' },
    { value: 'inactivo', label: 'Inactivo', color: '#6b7280' },
] as const

// Estados backoffice con contadores
export const ESTADOS_BACKOFFICE = [
    { value: 'pendiente', label: 'Pendiente', color: '#FFA500' },
    { value: 'comunicado', label: 'Comunicado', color: '#6b7280' },
    { value: 'tramite', label: 'Trámite', color: '#EAB308' },
    { value: 'reservado', label: 'Reservado', color: '#2196F3' },
    { value: 'postventa', label: 'Postventa', color: '#4CAF50' },
    { value: 'busqueda', label: 'Búsqueda', color: '#06B6D4' },
    { value: 'cerrado', label: 'Cerrado', color: '#f44336' },
] as const

// Categorías de contacto
export const CATEGORIAS_CONTACTO = [
    { value: 'vehiculo', label: 'Vehículo' },
    { value: 'financiacion', label: 'Financiación' },
    { value: 'postventa', label: 'Postventa' },
    { value: 'tasacion', label: 'Tasación' },
    { value: 'otro', label: 'Otro' },
] as const

// Asuntos de contacto
export const ASUNTOS_CONTACTO = [
    { value: 'info_vehiculo', label: 'Información vehículo' },
    { value: 'cita', label: 'Solicitud de cita' },
    { value: 'precio', label: 'Consulta de precio' },
    { value: 'financiacion', label: 'Consulta financiación' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'reclamacion', label: 'Reclamación' },
] as const

// Tipos de pago
export const TIPOS_PAGO = [
    { value: 'contado', label: 'Pago a contado' },
    { value: 'financiacion', label: 'Financiación' },
    { value: 'renting', label: 'Renting' },
] as const

// Tipos de cliente
export const TIPOS_CLIENTE = [
    { value: 'particular', label: 'Particular' },
    { value: 'empresa', label: 'Empresa' },
    { value: 'autonomo', label: 'Autónomo' },
] as const

// Tipos de documento
export const TIPOS_DOCUMENTO = [
    { value: 'dni', label: 'DNI' },
    { value: 'nie', label: 'NIE' },
    { value: 'cif', label: 'CIF' },
    { value: 'nif', label: 'NIF' },
] as const

// Comunidades Autónomas de España
export const COMUNIDADES_AUTONOMAS = [
    { value: 'andalucia', label: 'Andalucía' },
    { value: 'aragon', label: 'Aragón' },
    { value: 'asturias', label: 'Principado de Asturias' },
    { value: 'baleares', label: 'Islas Baleares' },
    { value: 'canarias', label: 'Canarias' },
    { value: 'cantabria', label: 'Cantabria' },
    { value: 'castilla_mancha', label: 'Castilla-La Mancha' },
    { value: 'castilla_leon', label: 'Castilla y León' },
    { value: 'catalunya', label: 'Cataluña' },
    { value: 'extremadura', label: 'Extremadura' },
    { value: 'galicia', label: 'Galicia' },
    { value: 'madrid', label: 'Comunidad de Madrid' },
    { value: 'murcia', label: 'Región de Murcia' },
    { value: 'navarra', label: 'Navarra' },
    { value: 'pais_vasco', label: 'País Vasco' },
    { value: 'rioja', label: 'La Rioja' },
    { value: 'valencia', label: 'Comunitat Valenciana' },
    { value: 'ceuta', label: 'Ceuta' },
    { value: 'melilla', label: 'Melilla' },
] as const

// Navegación principal
export const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/contactos', label: 'Contactos', icon: 'Mail' },
    { href: '/crm', label: 'CRM', icon: 'Users' },
    { href: '/inventario', label: 'Inventario', icon: 'Car' },
    { href: '/reportes', label: 'Reportes', icon: 'BarChart3' },
    { href: '/configuracion', label: 'Configuración', icon: 'Settings' },
] as const

// Menú Utilidades
export const UTILIDADES_MENU = [
    { href: '/informes', label: 'Informes trimestrales', icon: 'FileSpreadsheet' },
    { href: '/seguro', label: 'Control de seguros', icon: 'Shield' },
    { href: '/inventario/anuncios', label: 'Generador de anuncios', icon: 'Megaphone' },
] as const

// Configuración de negocio
export const BUSINESS_INFO = {
    name: 'MidCar',
    fullName: 'MidCar Vehículos de Ocasión',
    address: 'Torrejón de Ardoz, Madrid',
    phone: '+34 91 XXX XX XX',
    email: 'info@midcar.es',
    website: 'www.midcar.es',
    schedule: 'Lun-Vie: 10:00-14:00, 16:00-20:00 | Sáb: 10:00-14:00',
} as const

// Tipos de documento de vehículo
export const TIPOS_DOCUMENTO_VEHICULO = [
    { value: 'permiso_circulacion', label: 'Permiso de Circulación', required: true },
    { value: 'ficha_tecnica', label: 'Ficha Técnica', required: true },
    { value: 'itv', label: 'Última ITV', required: false },
    { value: 'informe_dgt', label: 'Informe DGT', required: false },
    { value: 'carfax', label: 'CARFAX / Historial', required: false },
    { value: 'libro_mantenimiento', label: 'Libro de Mantenimiento', required: false },
    { value: 'contrato_compra', label: 'Contrato de Compra', required: false },
    { value: 'factura_compra', label: 'Factura de Compra', required: false },
    { value: 'certificado_garantia', label: 'Certificado de Garantía', required: false },
    { value: 'otro', label: 'Otro', required: false },
] as const

