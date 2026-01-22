import { BaseDocumentTemplate } from './base-template';
import { SenalData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import {
  CLAUSULAS_SENAL,
  TEXTO_MANIFIESTAN,
  TEXTO_ESTIPULACIONES_SENAL,
  TEXTO_FIRMAS_SENAL
} from '../clauses/senal-clauses';
import { CLAUSULA_LOPD } from '../clauses/lopd-clause';

export class SenalTemplate extends BaseDocumentTemplate {
  private data: SenalData;

  constructor(data: SenalData, style: PDFStyleConfig = DEFAULT_PDF_STYLE) {
    super(style);
    this.data = data;
  }

  public generate(): void {
    this.addHeader();
    this.addDocumentTitle();
    this.addContractInfo();
    this.addReunidos();
    this.addManifiestan();
    this.addVehicleData(this.data.vehiculo);
    this.addCondicionesReserva();
    this.addEstipulaciones();
    this.addLOPD();
    this.addFirmas();
  }

  private addDocumentTitle(): void {
    this.setFont(18, 'bold');
    this.setTextColor(this.style.primaryColor);
    const title = 'CONTRATO DE SEÑAL / RESERVA DE VEHÍCULO';
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - titleWidth) / 2, this.currentY);
    this.setTextColor(this.style.secondaryColor);
    this.currentY += 10;
  }

  private addContractInfo(): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    const infoText = `En ${this.data.lugarContrato}, a ${this.formatDate(this.data.fechaContrato)}`;
    const infoWidth = this.doc.getTextWidth(infoText);
    this.doc.text(infoText, (this.pageWidth - infoWidth) / 2, this.currentY);
    this.currentY += 10;
  }

  private addReunidos(): void {
    this.addSectionTitle('REUNIDOS');
    this.addLineBreak(3);

    // Vendedor
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text('De una parte, como VENDEDOR:', this.style.margins.left, this.currentY);
    this.currentY += 6;
    this.addPersonData(this.data.vendedor, '');

    // Comprador
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text('De otra parte, como COMPRADOR:', this.style.margins.left, this.currentY);
    this.currentY += 6;
    this.addPersonData(this.data.comprador, '');
  }

  private addManifiestan(): void {
    this.addSectionTitle('MANIFIESTAN');
    this.addParagraph(TEXTO_MANIFIESTAN.trim());
  }

  private addCondicionesReserva(): void {
    this.checkPageBreak(40);
    this.addSectionTitle('CONDICIONES DE LA RESERVA', false);

    // Tabla con las condiciones
    const data = [
      { label: 'Importe de la señal:', value: this.formatCurrency(this.data.importeSenal) },
      { label: 'Precio total del vehículo:', value: this.formatCurrency(this.data.precioTotal) },
      { label: 'Resto a pagar:', value: this.formatCurrency(this.data.precioTotal - this.data.importeSenal) },
      { label: 'Cuenta bancaria:', value: this.data.cuentaBancaria },
      { label: 'Fecha límite para formalizar:', value: this.formatDate(this.data.fechaLimiteVenta) }
    ];

    // Crear tabla visual
    const startX = this.style.margins.left;
    const labelWidth = 70;

    this.setFillColor([248, 250, 252]);
    this.doc.rect(startX, this.currentY - 4, this.contentWidth, data.length * 8 + 4, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(startX, this.currentY - 4, this.contentWidth, data.length * 8 + 4, 'S');

    for (const item of data) {
      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(item.label, startX + 5, this.currentY);
      this.setFont(this.style.fontSize.normal, 'normal');
      this.doc.text(item.value, startX + labelWidth, this.currentY);
      this.currentY += 8;
    }

    this.currentY += 5;
  }

  private addEstipulaciones(): void {
    this.addSectionTitle(TEXTO_ESTIPULACIONES_SENAL);
    this.addLineBreak(3);

    for (const clausula of CLAUSULAS_SENAL) {
      this.checkPageBreak(35);

      // Número y título de la cláusula
      this.setFont(this.style.fontSize.normal, 'bold');
      this.setTextColor(this.style.primaryColor);
      this.doc.text(`${clausula.numero}ª - ${clausula.titulo}`, this.style.margins.left, this.currentY);
      this.setTextColor(this.style.secondaryColor);
      this.currentY += 6;

      // Contenido de la cláusula
      this.addParagraph(clausula.contenido);
      this.addLineBreak(2);
    }
  }

  private addLOPD(): void {
    this.checkPageBreak(80);
    this.addSectionTitle('PROTECCIÓN DE DATOS PERSONALES', false);
    this.setFont(this.style.fontSize.small, 'normal');

    const lines = this.doc.splitTextToSize(CLAUSULA_LOPD.trim(), this.contentWidth);
    for (const line of lines) {
      this.checkPageBreak(5);
      this.doc.text(line, this.style.margins.left, this.currentY);
      this.currentY += 3.5;
    }
    this.addLineBreak(5);
  }

  private addFirmas(): void {
    this.checkPageBreak(50);

    // Cláusulas adicionales si las hay
    if (this.data.clausulasAdicionales) {
      this.addSectionTitle('CLÁUSULAS ADICIONALES', false);
      this.addParagraph(this.data.clausulasAdicionales);
      this.addLineBreak(3);
    }

    // Texto de firmas
    this.addParagraph(TEXTO_FIRMAS_SENAL.trim());

    // Zonas de firma
    this.addSignatureArea();
  }
}

export function generateSenalPDF(data: SenalData, style?: PDFStyleConfig): SenalTemplate {
  const template = new SenalTemplate(data, style);
  template.generate();
  return template;
}
