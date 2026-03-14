// Tipos para el sistema de generación de documentos MidCar

export type DocumentType = 'compraventa' | 'senal' | 'factura' | 'proforma';

export interface DocumentTypeInfo {
  id: DocumentType;
  name: string;
  description: string;
  pages: number;
  icon: string;
}

export interface CustomerData {
  id?: string;
  nombre: string;
  apellidos: string;
  dni: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email?: string;
  isEmpresa?: boolean;
  nombreEmpresa?: string;
  cifEmpresa?: string;
}

export interface VehicleDocumentData {
  id: string;
  marca: string;
  modelo: string;
  version?: string;
  matricula: string;
  bastidor: string;
  fechaMatriculacion: string;
  kilometros: number;
  combustible: string;
  color?: string;
  potencia?: number;
  cilindrada?: number;
  plazas?: number;
  puertas?: number;
  fechaITV?: string;
  proximaITV?: string;
}

export interface EconomicConditions {
  precioVenta: number;
  baseImponible: number;
  ivaPercent: number;
  ivaImporte: number;
  totalConIva: number;
  formaPago: 'efectivo' | 'transferencia' | 'financiacion' | 'mixto';
  cuentaBancaria?: string;
  detallesPago?: string;
}

export interface CompraventaData {
  empresaId?: string;
  vehiculo: VehicleDocumentData;
  vendedor: CustomerData;
  comprador: CustomerData;
  condiciones: EconomicConditions;
  garantia: {
    meses: number;
    kilometros: number;
    descripcion?: string;
  };
  fechaEntrega: string;
  lugarEntrega: string;
  accesorios: {
    ruedaRepuesto: boolean;
    gato: boolean;
    llavesRepuesto: boolean;
    manuales: boolean;
    otros?: string;
  };
  documentacion: {
    fichaInspeccionTecnica: boolean;
    permisoCirculacion: boolean;
    ultimoReciboPagado: boolean;
  };
  clausulasAdicionales?: string;
  fechaContrato: string;
  lugarContrato: string;
}

export interface SenalData {
  empresaId?: string;
  vehiculo: VehicleDocumentData;
  vendedor: CustomerData;
  comprador: CustomerData;
  importeSenal: number;
  precioTotal: number;
  cuentaBancaria: string;
  fechaSenal: string;
  fechaLimiteVenta: string;
  clausulasAdicionales?: string;
  observaciones?: string;
  fechaContrato: string;
  lugarContrato: string;
}

export interface FacturaData {
  empresaId?: string;
  vehiculo: VehicleDocumentData;
  vendedor: CustomerData;
  comprador: CustomerData;
  condiciones: EconomicConditions;
  numeroFactura: string;
  fechaFactura: string;
  conceptoAdicional?: string;
}

export interface ProformaData extends FacturaData {
  numeroProforma: string;
  fechaProforma: string;
  importeReserva?: number;
  validezDias: number;
}

export interface GeneratedDocument {
  id?: string;
  tipo: DocumentType;
  vehiculoId: string;
  clienteId?: string;
  numeroDocumento: string;
  fechaGeneracion: string;
  datosDocumento: CompraventaData | SenalData | FacturaData | ProformaData;
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PDFStyleConfig {
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  accentColor: [number, number, number];
  fontFamily: string;
  fontSize: {
    title: number;
    subtitle: number;
    normal: number;
    small: number;
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  logoUrl?: string;
}

export interface DocumentGeneratorState {
  step: number;
  documentType: DocumentType | null;
  customer: CustomerData | null;
  isNewCustomer: boolean;
  formData: Partial<CompraventaData | SenalData | FacturaData | ProformaData>;
  isGenerating: boolean;
  error: string | null;
}
