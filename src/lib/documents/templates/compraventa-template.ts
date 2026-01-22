import { BaseDocumentTemplate } from './base-template';
import { CompraventaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import {
  CLAUSULAS_COMPRAVENTA,
  TEXTO_REUNIDOS_VENDEDOR,
  TEXTO_REUNIDOS_COMPRADOR,
  TEXTO_EXPONEN,
  TEXTO_ESTIPULACIONES,
  TEXTO_FIRMAS
} from '../clauses/compraventa-clauses';
import { CLAUSULA_LOPD_CORTA } from '../clauses/lopd-clause';

export class CompraventaTemplate extends BaseDocumentTemplate {
  private data: CompraventaData;

  constructor(data: CompraventaData, style: PDFStyleConfig = DEFAULT_PDF_STYLE) {
    super(style);
    this.data = data;
  }

  public generate(): void {
    this.addHeader();
    this.addDocumentTitle();
    this.addContractInfo();
    this.addReunidos();
    this.addExponen();
    this.addVehicleData(this.data.vehiculo);
    this.addEstipulaciones();
    this.addGarantia();
    this.addAccesorios();
    this.addDocumentacion();
    this.addLOPD();
    this.addFirmas();
  }

  private addDocumentTitle(): void {
    this.setFont(18, 'bold');
    this.setTextColor(this.style.primaryColor);
    const title = 'CONTRATO DE COMPRAVENTA DE VEHÍCULO';
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
    this.doc.text(TEXTO_REUNIDOS_VENDEDOR, this.style.margins.left, this.currentY);
    this.currentY += 6;
    this.addPersonData(this.data.vendedor, '');

    // Comprador
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(TEXTO_REUNIDOS_COMPRADOR, this.style.margins.left, this.currentY);
    this.currentY += 6;
    this.addPersonData(this.data.comprador, '');
  }

  private addExponen(): void {
    this.addSectionTitle('EXPONEN');
    this.addParagraph(TEXTO_EXPONEN.trim());
  }

  private addEstipulaciones(): void {
    this.addSectionTitle(TEXTO_ESTIPULACIONES);
    this.addLineBreak(3);

    for (const clausula of CLAUSULAS_COMPRAVENTA) {
      this.checkPageBreak(30);

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

  private addGarantia(): void {
    this.checkPageBreak(30);
    this.addSectionTitle('CONDICIONES DE GARANTÍA', false);

    const garantiaText = this.data.garantia.meses > 0
      ? `El vehículo objeto de este contrato cuenta con una garantía de ${this.data.garantia.meses} meses o ${this.data.garantia.kilometros.toLocaleString('es-ES')} kilómetros (lo que antes se cumpla), a contar desde la fecha de entrega.`
      : 'El vehículo se vende sin garantía, habiendo sido debidamente informado el comprador de esta circunstancia.';

    this.addParagraph(garantiaText);

    if (this.data.garantia.descripcion) {
      this.addParagraph(`Observaciones: ${this.data.garantia.descripcion}`);
    }

    this.addLineBreak(3);
  }

  private addAccesorios(): void {
    this.checkPageBreak(25);
    this.addSectionTitle('ACCESORIOS ENTREGADOS', false);

    const accesorios = this.data.accesorios;
    const items = [
      { nombre: 'Rueda de repuesto', incluido: accesorios.ruedaRepuesto },
      { nombre: 'Gato y herramientas', incluido: accesorios.gato },
      { nombre: 'Llaves de repuesto', incluido: accesorios.llavesRepuesto },
      { nombre: 'Manuales del vehículo', incluido: accesorios.manuales }
    ];

    this.setFont(this.style.fontSize.normal, 'normal');
    for (const item of items) {
      const check = item.incluido ? '☑' : '☐';
      this.doc.text(`${check} ${item.nombre}`, this.style.margins.left + 5, this.currentY);
      this.currentY += 5;
    }

    if (accesorios.otros) {
      this.currentY += 2;
      this.addLabelValue('Otros:', accesorios.otros);
    }

    this.addLineBreak(3);
  }

  private addDocumentacion(): void {
    this.checkPageBreak(25);
    this.addSectionTitle('DOCUMENTACIÓN ENTREGADA', false);

    const docs = this.data.documentacion;
    const items = [
      { nombre: 'Ficha de Inspección Técnica', incluido: docs.fichaInspeccionTecnica },
      { nombre: 'Permiso de Circulación', incluido: docs.permisoCirculacion },
      { nombre: 'Último recibo del Impuesto de Circulación', incluido: docs.ultimoReciboPagado }
    ];

    this.setFont(this.style.fontSize.normal, 'normal');
    for (const item of items) {
      const check = item.incluido ? '☑' : '☐';
      this.doc.text(`${check} ${item.nombre}`, this.style.margins.left + 5, this.currentY);
      this.currentY += 5;
    }

    this.addLineBreak(3);
  }

  private addLOPD(): void {
    this.checkPageBreak(30);
    this.addSectionTitle('PROTECCIÓN DE DATOS', false);
    this.setFont(this.style.fontSize.small, 'normal');
    const lines = this.doc.splitTextToSize(CLAUSULA_LOPD_CORTA.trim(), this.contentWidth);
    for (const line of lines) {
      this.doc.text(line, this.style.margins.left, this.currentY);
      this.currentY += 4;
    }
    this.addLineBreak(5);
  }

  private addFirmas(): void {
    this.checkPageBreak(60);

    // Condiciones económicas resumidas
    this.addSectionTitle('CONDICIONES ECONÓMICAS', false);

    const cond = this.data.condiciones;
    this.addEconomicTable(
      [
        { concepto: 'Base imponible', importe: cond.baseImponible },
        { concepto: `IVA (${cond.ivaPercent}%)`, importe: cond.ivaImporte }
      ],
      { label: 'TOTAL A PAGAR', importe: cond.totalConIva }
    );

    this.addLabelValue('Forma de pago:', this.getFormaPagoLabel(cond.formaPago));
    if (cond.cuentaBancaria) {
      this.addLabelValue('Cuenta bancaria:', cond.cuentaBancaria);
    }
    if (cond.detallesPago) {
      this.addLabelValue('Detalles:', cond.detallesPago);
    }

    this.addLineBreak(5);

    // Fecha y lugar de entrega
    this.addLabelValue('Fecha de entrega:', this.formatDate(this.data.fechaEntrega));
    this.addLabelValue('Lugar de entrega:', this.data.lugarEntrega);

    // Texto de firmas
    this.addLineBreak(5);
    this.addParagraph(TEXTO_FIRMAS.trim());

    // Zonas de firma
    this.addSignatureArea();
  }

  private getFormaPagoLabel(formaPago: string): string {
    const labels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia bancaria',
      'financiacion': 'Financiación',
      'mixto': 'Pago mixto'
    };
    return labels[formaPago] || formaPago;
  }
}

export function generateCompraventaPDF(data: CompraventaData, style?: PDFStyleConfig): CompraventaTemplate {
  const template = new CompraventaTemplate(data, style);
  template.generate();
  return template;
}
