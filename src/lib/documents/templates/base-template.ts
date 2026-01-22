import jsPDF from 'jspdf';
import { PDFStyleConfig, CustomerData, VehicleDocumentData } from '../document-types';
import { DEFAULT_PDF_STYLE, EMPRESA_DATOS } from '../constants';

// Datos de empresa para documentos
export interface EmpresaDocumentData {
  nombre: string;
  razonSocial?: string;
  cif: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  web?: string;
  logo?: string; // Base64 o URL
  cuentaBancaria?: string;
}

// Empresa por defecto (se usa si no se pasa una)
const DEFAULT_EMPRESA: EmpresaDocumentData = {
  nombre: EMPRESA_DATOS.nombre,
  cif: EMPRESA_DATOS.cif,
  direccion: EMPRESA_DATOS.direccion,
  codigoPostal: EMPRESA_DATOS.codigoPostal,
  localidad: EMPRESA_DATOS.localidad,
  provincia: EMPRESA_DATOS.provincia,
  telefono: EMPRESA_DATOS.telefono,
  email: EMPRESA_DATOS.email,
  web: EMPRESA_DATOS.web,
  cuentaBancaria: EMPRESA_DATOS.cuentaBancaria
};

export class BaseDocumentTemplate {
  protected doc: jsPDF;
  protected style: PDFStyleConfig;
  protected empresa: EmpresaDocumentData;
  protected pageWidth: number;
  protected pageHeight: number;
  protected contentWidth: number;
  protected currentY: number;
  protected pageNumber: number;

  constructor(style: PDFStyleConfig = DEFAULT_PDF_STYLE, empresa?: EmpresaDocumentData) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.style = style;
    this.empresa = empresa || DEFAULT_EMPRESA;
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.contentWidth = this.pageWidth - this.style.margins.left - this.style.margins.right;
    this.currentY = this.style.margins.top;
    this.pageNumber = 1;
  }

  // Configurar fuente
  protected setFont(size: number, style: 'normal' | 'bold' | 'italic' = 'normal'): void {
    this.doc.setFont(this.style.fontFamily, style);
    this.doc.setFontSize(size);
  }

  // Configurar color de texto
  protected setTextColor(color: [number, number, number]): void {
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  // Configurar color de relleno
  protected setFillColor(color: [number, number, number]): void {
    this.doc.setFillColor(color[0], color[1], color[2]);
  }

  // Añadir salto de línea
  protected addLineBreak(height: number = 5): void {
    this.currentY += height;
    this.checkPageBreak();
  }

  // Verificar si necesita nueva página
  protected checkPageBreak(requiredSpace: number = 20): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.style.margins.bottom) {
      this.addNewPage();
      return true;
    }
    return false;
  }

  // Añadir nueva página
  protected addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.style.margins.top;
    this.addHeader();
  }

  // Header con logo y datos de empresa
  protected addHeader(): void {
    // Fondo del header
    this.setFillColor(this.style.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

    let textStartX = this.style.margins.left;

    // Añadir logo si existe
    if (this.empresa.logo && this.empresa.logo.startsWith('data:image')) {
      try {
        // Logo en esquina izquierda
        this.doc.addImage(this.empresa.logo, 'PNG', this.style.margins.left, 5, 25, 25);
        textStartX = this.style.margins.left + 30; // Mover texto a la derecha del logo
      } catch (err) {
        console.error('Error añadiendo logo al PDF:', err);
      }
    }

    // Nombre de empresa
    this.setFont(16, 'bold');
    this.setTextColor([255, 255, 255]);
    this.doc.text(this.empresa.nombre, textStartX, 12);

    // Razón social si es diferente
    if (this.empresa.razonSocial && this.empresa.razonSocial !== this.empresa.nombre) {
      this.setFont(8, 'italic');
      this.doc.text(this.empresa.razonSocial, textStartX, 17);
    }

    // Datos de contacto
    this.setFont(8, 'normal');
    this.doc.text(`${this.empresa.direccion} | ${this.empresa.codigoPostal} ${this.empresa.localidad}`, textStartX, 22);

    const contactLine = [
      this.empresa.telefono ? `Tel: ${this.empresa.telefono}` : null,
      this.empresa.email,
      this.empresa.web
    ].filter(Boolean).join(' | ');
    this.doc.text(contactLine, textStartX, 27);

    this.doc.text(`CIF: ${this.empresa.cif}`, textStartX, 32);

    // Reset color
    this.setTextColor(this.style.secondaryColor);
    this.currentY = 45;
  }

  // Footer con número de página
  protected addFooter(): void {
    const footerY = this.pageHeight - 10;

    this.setFont(8, 'normal');
    this.setTextColor([128, 128, 128]);

    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.style.margins.left, footerY - 5, this.pageWidth - this.style.margins.right, footerY - 5);

    // Número de página centrado
    const pageText = `Página ${this.pageNumber}`;
    const textWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, (this.pageWidth - textWidth) / 2, footerY);

    // Reset color
    this.setTextColor(this.style.secondaryColor);
  }

  // Añadir footers a todas las páginas
  protected addAllFooters(): void {
    const totalPages = (this.doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.pageNumber = i;
      this.addFooter();
    }
  }

  // Título de sección con fondo
  protected addSectionTitle(title: string, withBackground: boolean = true): void {
    this.checkPageBreak(15);

    if (withBackground) {
      this.setFillColor(this.style.primaryColor);
      this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 10, 'F');

      this.setFont(this.style.fontSize.subtitle, 'bold');
      this.setTextColor([255, 255, 255]);
      this.doc.text(title, this.style.margins.left + 3, this.currentY + 2);

      this.setTextColor(this.style.secondaryColor);
    } else {
      this.setFont(this.style.fontSize.subtitle, 'bold');
      this.setTextColor(this.style.primaryColor);
      this.doc.text(title, this.style.margins.left, this.currentY);
      this.setTextColor(this.style.secondaryColor);
    }

    this.currentY += 10;
  }

  // Subtítulo
  protected addSubtitle(subtitle: string): void {
    this.checkPageBreak(10);
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(subtitle, this.style.margins.left, this.currentY);
    this.currentY += 6;
  }

  // Párrafo de texto con wrap automático
  protected addParagraph(text: string, indent: number = 0): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    const maxWidth = this.contentWidth - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      this.checkPageBreak(6);
      this.doc.text(line, this.style.margins.left + indent, this.currentY);
      this.currentY += 5;
    }
    this.currentY += 2;
  }

  // Texto en negrita + normal en la misma línea
  protected addLabelValue(label: string, value: string, indent: number = 0): void {
    this.checkPageBreak(6);

    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(label, this.style.margins.left + indent, this.currentY);

    const labelWidth = this.doc.getTextWidth(label + ' ');
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(value, this.style.margins.left + indent + labelWidth, this.currentY);

    this.currentY += 5;
  }

  // Tabla simple de dos columnas
  protected addTwoColumnTable(data: Array<{ label: string; value: string }>, startX?: number): void {
    const x = startX || this.style.margins.left;
    const colWidth = (this.contentWidth - (startX ? startX - this.style.margins.left : 0)) / 2;

    for (let i = 0; i < data.length; i += 2) {
      this.checkPageBreak(6);

      // Columna izquierda
      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(data[i].label, x, this.currentY);
      this.setFont(this.style.fontSize.normal, 'normal');
      const labelWidth1 = this.doc.getTextWidth(data[i].label + ' ');
      this.doc.text(data[i].value, x + labelWidth1, this.currentY);

      // Columna derecha (si existe)
      if (data[i + 1]) {
        const x2 = x + colWidth;
        this.setFont(this.style.fontSize.normal, 'bold');
        this.doc.text(data[i + 1].label, x2, this.currentY);
        this.setFont(this.style.fontSize.normal, 'normal');
        const labelWidth2 = this.doc.getTextWidth(data[i + 1].label + ' ');
        this.doc.text(data[i + 1].value, x2 + labelWidth2, this.currentY);
      }

      this.currentY += 5;
    }
  }

  // Datos de persona (cliente/vendedor)
  protected addPersonData(persona: CustomerData, titulo: string): void {
    this.addSubtitle(titulo);

    const nombreCompleto = persona.isEmpresa
      ? `${persona.nombreEmpresa} (${persona.nombre} ${persona.apellidos})`
      : `${persona.nombre} ${persona.apellidos}`;

    const identificacion = persona.isEmpresa
      ? `CIF: ${persona.cifEmpresa} / DNI Rep.: ${persona.dni}`
      : `DNI/NIE: ${persona.dni}`;

    const direccionCompleta = `${persona.direccion}, ${persona.codigoPostal} ${persona.localidad} (${persona.provincia})`;

    this.addLabelValue('Nombre:', nombreCompleto);
    this.addLabelValue('Identificación:', identificacion);
    this.addLabelValue('Domicilio:', direccionCompleta);
    this.addLabelValue('Teléfono:', persona.telefono);
    if (persona.email) {
      this.addLabelValue('Email:', persona.email);
    }

    this.addLineBreak(3);
  }

  // Datos del vehículo
  protected addVehicleData(vehiculo: VehicleDocumentData): void {
    this.addSubtitle('DATOS DEL VEHÍCULO');

    const data = [
      { label: 'Marca:', value: vehiculo.marca },
      { label: 'Modelo:', value: vehiculo.modelo + (vehiculo.version ? ` ${vehiculo.version}` : '') },
      { label: 'Matrícula:', value: vehiculo.matricula },
      { label: 'Bastidor:', value: vehiculo.bastidor },
      { label: 'Fecha matriculación:', value: vehiculo.fechaMatriculacion },
      { label: 'Kilómetros:', value: vehiculo.kilometros.toLocaleString('es-ES') + ' km' },
      { label: 'Combustible:', value: vehiculo.combustible },
      { label: 'Color:', value: vehiculo.color || 'N/D' }
    ];

    if (vehiculo.potencia) {
      data.push({ label: 'Potencia:', value: `${vehiculo.potencia} CV` });
    }
    if (vehiculo.fechaITV) {
      data.push({ label: 'Última ITV:', value: vehiculo.fechaITV });
    }

    this.addTwoColumnTable(data);
    this.addLineBreak(3);
  }

  // Tabla económica
  protected addEconomicTable(data: Array<{ concepto: string; importe: number }>, total?: { label: string; importe: number }): void {
    const startX = this.style.margins.left;
    const conceptoWidth = this.contentWidth * 0.7;
    const importeWidth = this.contentWidth * 0.3;

    // Header de tabla
    this.setFillColor([240, 240, 240]);
    this.doc.rect(startX, this.currentY - 4, this.contentWidth, 8, 'F');

    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text('Concepto', startX + 2, this.currentY);
    this.doc.text('Importe', startX + conceptoWidth + 2, this.currentY);
    this.currentY += 8;

    // Filas de datos
    this.setFont(this.style.fontSize.normal, 'normal');
    for (const item of data) {
      this.checkPageBreak(8);

      // Línea inferior
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(startX, this.currentY + 3, startX + this.contentWidth, this.currentY + 3);

      this.doc.text(item.concepto, startX + 2, this.currentY);
      this.doc.text(this.formatCurrency(item.importe), startX + conceptoWidth + 2, this.currentY);
      this.currentY += 8;
    }

    // Total
    if (total) {
      this.setFillColor(this.style.primaryColor);
      this.doc.rect(startX, this.currentY - 4, this.contentWidth, 10, 'F');

      this.setFont(this.style.fontSize.subtitle, 'bold');
      this.setTextColor([255, 255, 255]);
      this.doc.text(total.label, startX + 2, this.currentY + 2);
      this.doc.text(this.formatCurrency(total.importe), startX + conceptoWidth + 2, this.currentY + 2);

      this.setTextColor(this.style.secondaryColor);
      this.currentY += 12;
    }
  }

  // Zona de firmas
  protected addSignatureArea(): void {
    this.checkPageBreak(50);
    this.addLineBreak(10);

    const leftX = this.style.margins.left + 10;
    const rightX = this.pageWidth / 2 + 10;
    const lineWidth = 60;

    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text('EL VENDEDOR', leftX, this.currentY);
    this.doc.text('EL COMPRADOR', rightX, this.currentY);

    this.currentY += 25;

    // Líneas de firma
    this.doc.setDrawColor(100, 100, 100);
    this.doc.line(leftX, this.currentY, leftX + lineWidth, this.currentY);
    this.doc.line(rightX, this.currentY, rightX + lineWidth, this.currentY);

    this.currentY += 5;

    this.setFont(this.style.fontSize.small, 'normal');
    this.doc.text('Fdo.:', leftX, this.currentY);
    this.doc.text('Fdo.:', rightX, this.currentY);
  }

  // Formatear moneda
  protected formatCurrency(amount: number): string {
    return amount.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  // Formatear fecha
  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // Generar y descargar PDF
  public download(filename: string): void {
    this.addAllFooters();
    this.doc.save(filename);
  }

  // Obtener blob del PDF
  public getBlob(): Blob {
    this.addAllFooters();
    return this.doc.output('blob');
  }

  // Obtener data URL para preview
  public getDataUrl(): string {
    this.addAllFooters();
    return this.doc.output('dataurlstring');
  }
}
