import { BaseDocumentTemplate, EmpresaDocumentData } from './base-template';
import { FacturaData, PDFStyleConfig, CustomerData } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import {
  buildDocumentIdentifier,
  generateIdentifierQRDataUrl
} from '../identifier';

/**
 * Template fiel al diseño de la factura MidCar (referencia 2024):
 *   - Título "FACTURA" centrado
 *   - Nº de factura (izq.) y fecha (der.) en una misma fila
 *   - Dos bloques "Facturar a:" en columnas
 *   - Cabecera azul "Descripción del vehiculo"
 *   - Filas de datos del vehículo
 *   - Bloque inferior derecho con totales (Neto / IVA / Total)
 *   - Pie centrado "GRACIAS POR SU CONFIANZA"
 *   - Watermark "FACTURA" gris diagonal
 *   - Banda inferior con identificador único MidCar + QR
 */
export class FacturaTemplate extends BaseDocumentTemplate {
  protected data: FacturaData;
  protected tituloDocumento = 'FACTURA';
  protected etiquetaTotal = 'Total Factura (EURO)';
  protected etiquetaWatermark = 'FACTURA';
  protected identifier: string;
  protected qrDataUrl: string | undefined;

  constructor(
    data: FacturaData,
    style: PDFStyleConfig = DEFAULT_PDF_STYLE,
    empresa?: EmpresaDocumentData
  ) {
    super(style, empresa);
    this.data = data;
    this.identifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'factura',
        numeroDocumento: data.numeroFactura,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaFactura
      });
    this.qrDataUrl = data.qrDataUrl;
    this.suppressCorporateHeader = true;
    this.reserveIdentifierStrip();
  }

  public async ensureQRReady(): Promise<void> {
    if (!this.qrDataUrl) {
      this.qrDataUrl = await generateIdentifierQRDataUrl(this.identifier);
    }
  }

  public getIdentifier(): string {
    return this.identifier;
  }

  public generate(): void {
    this.addTituloDocumento();
    this.addNumeroYFecha();
    this.addBloquesFacturarA();
    this.addCabeceraAzul('Descripción del vehiculo');
    this.addFilasVehiculo();
    this.addBloqueTotales();
    this.addGraciasPorSuConfianza();
    this.applyMidCarOverlay();
  }

  // ===========================================================================
  // SECCIONES (compartidas con la Proforma)
  // ===========================================================================
  protected addTituloDocumento(): void {
    this.setFont(20, 'bold');
    this.setTextColor(this.style.secondaryColor);
    const w = this.doc.getTextWidth(this.tituloDocumento);
    this.doc.text(this.tituloDocumento, (this.pageWidth - w) / 2, this.currentY + 5);
    this.currentY += 18;
  }

  protected addNumeroYFecha(): void {
    const numeroDoc =
      'numeroFactura' in this.data ? this.data.numeroFactura : '';
    const fechaDoc =
      'fechaFactura' in this.data ? this.data.fechaFactura : '';

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor(this.style.secondaryColor);
    this.doc.text('N.º de factura:', this.style.margins.left, this.currentY);
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(numeroDoc, this.style.margins.left + 35, this.currentY);

    this.setFont(this.style.fontSize.normal, 'bold');
    const fechaLabel = 'Fecha de la factura:';
    this.doc.text(fechaLabel, this.pageWidth - this.style.margins.right - 60, this.currentY);
    this.doc.text(
      this.formatShortDate(fechaDoc),
      this.pageWidth - this.style.margins.right - 20,
      this.currentY
    );

    this.currentY += 12;
  }

  protected addBloquesFacturarA(): void {
    const startY = this.currentY;
    const halfWidth = this.contentWidth / 2;
    const leftBlockX = this.style.margins.left;
    const rightBlockX = this.style.margins.left + halfWidth + 5;

    // Línea azul vertical estilo "barra" a la izquierda de cada bloque
    this.doc.setDrawColor(this.style.primaryColor[0], this.style.primaryColor[1], this.style.primaryColor[2]);
    this.doc.setLineWidth(1);
    this.doc.line(leftBlockX, startY, leftBlockX, startY + 28);
    this.doc.line(rightBlockX, startY, rightBlockX, startY + 28);
    this.doc.setLineWidth(0.2);

    this.renderFacturarABlock(leftBlockX + 4, startY, this.data.comprador, 'Cliente:', { caps: false });
    this.renderFacturarABlock(rightBlockX + 4, startY, this.data.comprador, 'Facturar a:', { caps: true });

    this.currentY = startY + 32;
  }

  protected renderFacturarABlock(
    x: number,
    y: number,
    persona: CustomerData,
    label: string,
    opts: { caps: boolean }
  ): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor([60, 60, 60]);
    this.doc.text(label, x, y + 2);
    this.doc.setDrawColor(160, 160, 160);
    this.doc.line(x, y + 3, x + this.doc.getTextWidth(label), y + 3);

    let cursorY = y + 8;
    const nombre = persona.isEmpresa
      ? (persona.nombreEmpresa || '')
      : `${persona.nombre} ${persona.apellidos}`;
    const nombreFormatted = opts.caps ? nombre.toUpperCase() : nombre;

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor(this.style.secondaryColor);
    this.doc.text(nombreFormatted, x, cursorY);
    cursorY += 5;

    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(persona.direccion, x, cursorY);
    cursorY += 5;
    this.doc.text(
      `${persona.codigoPostal} - ${persona.localidad}${persona.provincia ? ' - ' + persona.provincia : ''}`,
      x,
      cursorY
    );
    cursorY += 5;

    this.setFont(this.style.fontSize.normal, 'bold');
    const idDoc = persona.isEmpresa ? persona.cifEmpresa || '' : persona.dni;
    this.doc.text(idDoc, x, cursorY);
  }

  protected addCabeceraAzul(titulo: string): void {
    this.setFillColor([91, 175, 211]); // Azul claro estilo factura
    this.doc.rect(this.style.margins.left, this.currentY, this.contentWidth, 8, 'F');
    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor([255, 255, 255]);
    this.doc.text(titulo, this.style.margins.left + 3, this.currentY + 5.5);
    this.setTextColor(this.style.secondaryColor);
    this.currentY += 12;
  }

  protected addFilasVehiculo(): void {
    const v = this.data.vehiculo;
    const filas: Array<{ l: string; v: string }> = [
      { l: 'Marca y modelo:', v: `${v.marca} ${v.modelo}${v.version ? ' ' + v.version : ''}` },
      { l: 'Numero bastidor:', v: v.bastidor },
      { l: 'Km. Recorridos:', v: v.kilometros.toLocaleString('es-ES') },
      { l: 'Matricula:', v: v.matricula },
      { l: 'Numero cuenta:', v: this.data.condiciones.cuentaBancaria || this.empresa.cuentaBancaria || '' }
    ];

    for (const f of filas) {
      this.checkPageBreak(6);
      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(f.l, this.style.margins.left, this.currentY);
      this.setFont(this.style.fontSize.normal, 'normal');
      this.doc.text(f.v, this.style.margins.left + 40, this.currentY);
      this.currentY += 6;
    }

    this.addExtraFilas();
    this.currentY += 4;
  }

  // Hook para que la Proforma añada "Importe reserva"
  protected addExtraFilas(): void {
    // no-op aquí
  }

  protected addBloqueTotales(): void {
    // Línea divisoria horizontal azul claro
    this.doc.setDrawColor(91, 175, 211);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.style.margins.left,
      this.currentY + 60,
      this.pageWidth - this.style.margins.right,
      this.currentY + 60
    );
    this.doc.setLineWidth(0.2);

    const cond = this.data.condiciones;
    const rightX = this.pageWidth - this.style.margins.right;
    const labelX = rightX - 55;
    const valueX = rightX;

    this.preNotaProforma();

    const filas: Array<{ label: string; valor: string; bold?: boolean }> = [
      { label: 'Total neto:', valor: this.formatEuro(cond.baseImponible) },
      { label: `Total IVA (${cond.ivaPercent}%):`, valor: this.formatEuro(cond.ivaImporte) },
      { label: this.etiquetaTotal, valor: this.formatEuro(cond.totalConIva), bold: true }
    ];

    let y = this.currentY + 65;
    for (const f of filas) {
      this.setFont(this.style.fontSize.normal, f.bold ? 'bold' : 'normal');
      this.doc.text(f.label, labelX, y, { align: 'left' });
      this.doc.text(f.valor, valueX, y, { align: 'right' });
      y += 6;
    }

    // línea inferior azul claro
    this.doc.setDrawColor(91, 175, 211);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.style.margins.left, y, this.pageWidth - this.style.margins.right, y);
    this.doc.setLineWidth(0.2);

    this.currentY = y + 10;
  }

  // Hook para que la Proforma añada su nota destacada antes de los totales
  protected preNotaProforma(): void {
    // no-op aquí
  }

  protected addGraciasPorSuConfianza(): void {
    // Empujamos al pie de la página (justo encima de la banda de identificador)
    const targetY = this.pageHeight - this.style.margins.bottom - 6;
    this.setFont(13, 'bold');
    this.setTextColor(this.style.secondaryColor);
    const text = 'GRACIAS POR SU CONFIANZA';
    const w = this.doc.getTextWidth(text);
    this.doc.text(text, (this.pageWidth - w) / 2, Math.max(this.currentY + 20, targetY));
  }

  protected applyMidCarOverlay(): void {
    this.addWatermark(this.etiquetaWatermark);
    this.addMidCarIdentifierStrip(this.identifier, this.qrDataUrl);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================
  protected formatEuro(n: number): string {
    return n.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  protected formatShortDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = date.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }
}

export function generateFacturaPDF(
  data: FacturaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): FacturaTemplate {
  const template = new FacturaTemplate(data, style, empresa);
  template.generate();
  return template;
}

export async function generateFacturaPDFWithQR(
  data: FacturaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): Promise<FacturaTemplate> {
  const template = new FacturaTemplate(data, style, empresa);
  await template.ensureQRReady();
  template.generate();
  return template;
}
