import { DocumentTypeInfo, PDFStyleConfig } from './document-types';

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  {
    id: 'compraventa',
    name: 'Contrato de Compraventa',
    description: 'Documento legal para la venta definitiva del vehículo. Incluye todas las cláusulas legales, garantía y condiciones de entrega.',
    pages: 3,
    icon: 'FileText'
  },
  {
    id: 'senal',
    name: 'Contrato de Señal',
    description: 'Documento para reservar un vehículo mediante el pago de una señal. Establece las condiciones de la reserva.',
    pages: 2,
    icon: 'FileSignature'
  },
  {
    id: 'factura',
    name: 'Factura',
    description: 'Documento fiscal oficial que acredita la venta del vehículo con desglose de IVA.',
    pages: 1,
    icon: 'Receipt'
  },
  {
    id: 'proforma',
    name: 'Factura Proforma',
    description: 'Presupuesto previo no vinculante. Útil para reservas o financiaciones pendientes de aprobación.',
    pages: 1,
    icon: 'FileSpreadsheet'
  }
];

export const DEFAULT_PDF_STYLE: PDFStyleConfig = {
  primaryColor: [19, 91, 236],      // #135BEC - Azul MidCar
  secondaryColor: [30, 41, 59],     // #1E293B - Slate oscuro
  accentColor: [16, 185, 129],      // #10B981 - Verde esmeralda
  fontFamily: 'Helvetica',
  fontSize: {
    title: 16,
    subtitle: 12,
    normal: 10,
    small: 8
  },
  margins: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  }
};

export const FORMA_PAGO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'financiacion', label: 'Financiación' },
  { value: 'mixto', label: 'Pago mixto' }
];

export const GARANTIA_OPTIONS = [
  { meses: 0, kilometros: 0, label: 'Sin garantía' },
  { meses: 3, kilometros: 3000, label: '3 meses / 3.000 km' },
  { meses: 6, kilometros: 6000, label: '6 meses / 6.000 km' },
  { meses: 12, kilometros: 12000, label: '12 meses / 12.000 km' },
  { meses: 24, kilometros: 24000, label: '24 meses / 24.000 km' }
];

export const IVA_PERCENT = 21;

// Opciones de IVA disponibles
export const IVA_OPTIONS = [
  { value: 21, label: 'IVA General (21%)', description: 'Tipo general para la mayoría de bienes' },
  { value: 10, label: 'IVA Reducido (10%)', description: 'Tipo reducido' },
  { value: 4, label: 'IVA Superreducido (4%)', description: 'Tipo superreducido' },
  { value: 0, label: 'Exento de IVA (0%)', description: 'Operaciones exentas o entre particulares' },
  { value: 7, label: 'IGIC General (7%)', description: 'Canarias - Tipo general' },
  { value: 3, label: 'IGIC Reducido (3%)', description: 'Canarias - Tipo reducido' },
];

// Fallback de último recurso si no llega la empresa seleccionada desde el
// asistente. Los documentos SIEMPRE deben usar la empresa elegida en el paso
// "Empresa" (tabla `empresas` de Supabase); estos datos solo evitan imprimir
// campos vacíos si ese flujo falla.
export const EMPRESA_DATOS = {
  nombre: 'MID CAR SOLUCIONES SL',
  cif: 'B87595435',
  direccion: 'Calle Polo Sur, Nrº2',
  codigoPostal: '28850',
  localidad: 'Torrejón de Ardoz',
  provincia: 'Madrid',
  telefono: '617728087',
  email: 'Info@midcar.net',
  web: 'www.midcar.net',
  cuentaBancaria: 'ES 02 30230121616281520707'
};

export const PROVINCIAS_ESPANA = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Baleares', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón',
  'Ciudad Real', 'Córdoba', 'Coruña', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara',
  'Guipúzcoa', 'Huelva', 'Huesca', 'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid',
  'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia', 'Palmas (Las)', 'Pontevedra',
  'Rioja (La)', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
];
