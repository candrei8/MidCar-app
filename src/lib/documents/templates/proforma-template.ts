import { FacturaTemplate } from './factura-template';
import { ProformaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';

export class ProformaTemplate extends FacturaTemplate {
  protected data: ProformaData;

  constructor(data: ProformaData, style: PDFStyleConfig = DEFAULT_PDF_STYLE) {
    super(data, style);
    this.data = data;
  }

  public generate(): void {
    this.addHeader();
    this.addProformaHeader();
    this.addClienteData();
    this.addVehicleDescription();
    this.addDesgloseEconomico();
    this.addReservaInfo();
    this.addFormaPago();
    this.addNotaProforma();
    this.addValidez();
  }

  private addProformaHeader(): void {
    // Título de proforma con número
    this.setFont(20, 'bold');
    this.setTextColor(this.style.primaryColor);
    this.doc.text('FACTURA PROFORMA', this.style.margins.left, this.currentY);

    // Número y fecha en la derecha
    const rightX = this.pageWidth - this.style.margins.right;
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(`Nº: ${this.data.numeroProforma}`, rightX - 50, this.currentY - 5, { align: 'left' });
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(`Fecha: ${this.formatDate(this.data.fechaProforma)}`, rightX - 50, this.currentY + 2, { align: 'left' });

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 10;

    // Nota de proforma destacada
    this.setFillColor([254, 243, 199]); // Amarillo suave
    this.doc.rect(this.style.margins.left, this.currentY, this.contentWidth, 12, 'F');
    this.doc.setDrawColor(251, 191, 36);
    this.doc.rect(this.style.margins.left, this.currentY, this.contentWidth, 12, 'S');

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor([146, 64, 14]); // Ámbar oscuro
    const notaText = 'DOCUMENTO NO VÁLIDO COMO FACTURA - PRESUPUESTO PREVIO';
    const notaWidth = this.doc.getTextWidth(notaText);
    this.doc.text(notaText, (this.pageWidth - notaWidth) / 2, this.currentY + 7);

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 20;

    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.style.margins.left, this.currentY, this.pageWidth - this.style.margins.right, this.currentY);
    this.currentY += 10;
  }

  private addReservaInfo(): void {
    if (this.data.importeReserva && this.data.importeReserva > 0) {
      this.checkPageBreak(25);

      this.setFillColor([236, 253, 245]); // Verde suave
      this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 20, 'F');
      this.doc.setDrawColor(16, 185, 129);
      this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 20, 'S');

      this.setFont(this.style.fontSize.normal, 'bold');
      this.setTextColor([6, 95, 70]); // Verde oscuro
      this.doc.text('IMPORTE RESERVA SUGERIDO:', this.style.margins.left + 5, this.currentY + 2);

      this.setFont(this.style.fontSize.subtitle, 'bold');
      this.doc.text(this.formatCurrency(this.data.importeReserva), this.style.margins.left + 5, this.currentY + 10);

      this.setTextColor(this.style.secondaryColor);
      this.currentY += 25;
    }
  }

  private addNotaProforma(): void {
    this.checkPageBreak(30);

    // Caja de notas importantes
    this.setFillColor([254, 242, 242]); // Rojo suave
    this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 25, 'F');
    this.doc.setDrawColor(239, 68, 68);
    this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 25, 'S');

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor([153, 27, 27]); // Rojo oscuro
    this.doc.text('IMPORTANTE:', this.style.margins.left + 5, this.currentY + 2);

    this.setFont(this.style.fontSize.normal, 'normal');
    const notas = [
      '• Este documento es un presupuesto previo y no tiene validez fiscal.',
      '• No justifica la venta del vehículo hasta que se formalice el pago.',
      '• Los precios indicados están sujetos a disponibilidad del vehículo.'
    ];

    for (let i = 0; i < notas.length; i++) {
      this.doc.text(notas[i], this.style.margins.left + 5, this.currentY + 8 + (i * 5));
    }

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 30;
  }

  private addValidez(): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor([128, 128, 128]);

    const validezText = `Esta proforma tiene una validez de ${this.data.validezDias} días a partir de la fecha de emisión.`;
    this.doc.text(validezText, this.style.margins.left, this.currentY);

    const fechaExpiracion = new Date(this.data.fechaProforma);
    fechaExpiracion.setDate(fechaExpiracion.getDate() + this.data.validezDias);

    this.currentY += 5;
    this.doc.text(`Fecha de expiración: ${this.formatDate(fechaExpiracion.toISOString())}`, this.style.margins.left, this.currentY);

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 10;
  }
}

export function generateProformaPDF(data: ProformaData, style?: PDFStyleConfig): ProformaTemplate {
  const template = new ProformaTemplate(data, style);
  template.generate();
  return template;
}
