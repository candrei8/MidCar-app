import { FacturaTemplate } from './factura-template';
import { ProformaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE, EMPRESA_DATOS } from '../constants';

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
    this.doc.rect(this.style.margins.left, this.currentY, this.contentWidth, 10, 'F');
    this.doc.setDrawColor(251, 191, 36);
    this.doc.rect(this.style.margins.left, this.currentY, this.contentWidth, 10, 'S');

    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([146, 64, 14]); // Ámbar oscuro
    const notaText = 'DOCUMENTO NO VÁLIDO COMO FACTURA - PRESUPUESTO PREVIO';
    const notaWidth = this.doc.getTextWidth(notaText);
    this.doc.text(notaText, (this.pageWidth - notaWidth) / 2, this.currentY + 6);

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 14;

    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.style.margins.left, this.currentY, this.pageWidth - this.style.margins.right, this.currentY);
    this.currentY += 6;
  }

  // Override: tighter client data layout
  protected addClienteData(): void {
    const startY = this.currentY;

    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([128, 128, 128]);
    this.doc.text('EMISOR', this.style.margins.left, this.currentY);
    this.currentY += 4;

    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor(this.style.secondaryColor);
    this.doc.text(EMPRESA_DATOS.nombre, this.style.margins.left, this.currentY);
    this.currentY += 4;
    this.doc.text(`CIF: ${EMPRESA_DATOS.cif}`, this.style.margins.left, this.currentY);
    this.currentY += 4;
    this.doc.text(EMPRESA_DATOS.direccion, this.style.margins.left, this.currentY);
    this.currentY += 4;
    this.doc.text(`${EMPRESA_DATOS.codigoPostal} ${EMPRESA_DATOS.localidad}`, this.style.margins.left, this.currentY);

    const rightX = this.pageWidth / 2 + 10;
    let clienteY = startY;

    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([128, 128, 128]);
    this.doc.text('CLIENTE', rightX, clienteY);
    clienteY += 4;

    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor(this.style.secondaryColor);

    const cliente = this.data.comprador;
    const nombreCliente = cliente.isEmpresa
      ? cliente.nombreEmpresa || ''
      : `${cliente.nombre} ${cliente.apellidos}`;
    const identificacion = cliente.isEmpresa
      ? `CIF: ${cliente.cifEmpresa}`
      : `DNI/NIE: ${cliente.dni}`;

    this.doc.text(nombreCliente, rightX, clienteY);
    clienteY += 4;
    this.doc.text(identificacion, rightX, clienteY);
    clienteY += 4;
    this.doc.text(cliente.direccion, rightX, clienteY);
    clienteY += 4;
    this.doc.text(`${cliente.codigoPostal} ${cliente.localidad} (${cliente.provincia})`, rightX, clienteY);

    this.currentY = Math.max(this.currentY, clienteY) + 8;
  }

  // Override: tighter vehicle description
  protected addVehicleDescription(): void {
    this.setFillColor(this.style.primaryColor);
    this.doc.rect(this.style.margins.left, this.currentY - 4, this.contentWidth, 8, 'F');

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor([255, 255, 255]);
    this.doc.text('DESCRIPCIÓN', this.style.margins.left + 5, this.currentY);
    this.setTextColor(this.style.secondaryColor);
    this.currentY += 8;

    const vehiculo = this.data.vehiculo;
    const descripcion = `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.version ? ' ' + vehiculo.version : ''}`;
    const detalles = [
      `Matrícula: ${vehiculo.matricula}`,
      `Bastidor: ${vehiculo.bastidor}`,
      `Fecha matriculación: ${vehiculo.fechaMatriculacion}`,
      `Kilómetros: ${vehiculo.kilometros.toLocaleString('es-ES')} km`,
      `Combustible: ${vehiculo.combustible}`
    ];

    this.setFillColor([248, 250, 252]);
    const boxH = 4 + 6 + detalles.length * 4 + 2;
    this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, boxH, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, boxH, 'S');

    this.setFont(this.style.fontSize.subtitle, 'bold');
    this.doc.text(descripcion, this.style.margins.left + 5, this.currentY + 2);
    this.currentY += 7;

    this.setFont(this.style.fontSize.normal, 'normal');
    for (const detalle of detalles) {
      this.doc.text(detalle, this.style.margins.left + 5, this.currentY);
      this.currentY += 4;
    }

    if (this.data.conceptoAdicional) {
      this.currentY += 3;
      this.setFillColor([255, 255, 255]);
      this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 8, 'F');
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 8, 'S');
      this.doc.text(this.data.conceptoAdicional, this.style.margins.left + 5, this.currentY + 1);
      this.currentY += 8;
    }

    this.currentY += 5;
  }

  // Override: tighter economic breakdown
  protected addDesgloseEconomico(): void {
    const cond = this.data.condiciones;
    const rightX = this.pageWidth - this.style.margins.right - 80;

    this.setFillColor([248, 250, 252]);
    this.doc.rect(rightX - 10, this.currentY - 4, 90, 40, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(rightX - 10, this.currentY - 4, 90, 40, 'S');

    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text('Base imponible:', rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.baseImponible), rightX + 70, this.currentY, { align: 'right' });
    this.currentY += 7;

    this.doc.text(`IVA (${cond.ivaPercent}%):`, rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.ivaImporte), rightX + 70, this.currentY, { align: 'right' });
    this.currentY += 7;

    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(rightX, this.currentY, rightX + 70, this.currentY);
    this.currentY += 7;

    this.setFont(this.style.fontSize.subtitle, 'bold');
    this.setTextColor(this.style.primaryColor);
    this.doc.text('TOTAL:', rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.totalConIva), rightX + 70, this.currentY, { align: 'right' });
    this.setTextColor(this.style.secondaryColor);

    this.currentY += 12;
  }

  // Override: tighter forma de pago
  protected addFormaPago(): void {
    this.addSectionTitle('FORMA DE PAGO', false);

    const cond = this.data.condiciones;
    const formaPagoLabels: Record<string, string> = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia bancaria',
      'financiacion': 'Financiación',
      'mixto': 'Pago mixto'
    };

    this.addLabelValue('Forma de pago:', formaPagoLabels[cond.formaPago] || cond.formaPago);

    if (cond.cuentaBancaria) {
      this.addLabelValue('Cuenta bancaria:', cond.cuentaBancaria);
    }

    if (cond.detallesPago) {
      this.addLabelValue('Observaciones:', cond.detallesPago);
    }

    this.addLineBreak(3);
  }

  private addReservaInfo(): void {
    if (this.data.importeReserva && this.data.importeReserva > 0) {
      this.setFillColor([236, 253, 245]); // Verde suave
      this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 14, 'F');
      this.doc.setDrawColor(16, 185, 129);
      this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 14, 'S');

      this.setFont(this.style.fontSize.normal, 'bold');
      this.setTextColor([6, 95, 70]); // Verde oscuro
      this.doc.text('IMPORTE RESERVA SUGERIDO:', this.style.margins.left + 5, this.currentY + 3);

      this.setFont(this.style.fontSize.subtitle, 'bold');
      this.doc.text(this.formatCurrency(this.data.importeReserva), this.style.margins.left + 80, this.currentY + 3);

      this.setTextColor(this.style.secondaryColor);
      this.currentY += 16;
    }
  }

  private addNotaProforma(): void {
    // Caja de notas importantes
    this.setFillColor([254, 242, 242]); // Rojo suave
    this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 18, 'F');
    this.doc.setDrawColor(239, 68, 68);
    this.doc.rect(this.style.margins.left, this.currentY - 3, this.contentWidth, 18, 'S');

    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([153, 27, 27]); // Rojo oscuro
    this.doc.text('IMPORTANTE:', this.style.margins.left + 5, this.currentY + 2);

    this.setFont(this.style.fontSize.small, 'normal');
    const notas = [
      '• Este documento es un presupuesto previo y no tiene validez fiscal.',
      '• No justifica la venta del vehículo hasta que se formalice el pago.',
      '• Los precios indicados están sujetos a disponibilidad del vehículo.'
    ];

    for (let i = 0; i < notas.length; i++) {
      this.doc.text(notas[i], this.style.margins.left + 5, this.currentY + 6 + (i * 4));
    }

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 20;
  }

  private addValidez(): void {
    this.setFont(this.style.fontSize.small, 'normal');
    this.setTextColor([128, 128, 128]);

    const fechaExpiracion = new Date(this.data.fechaProforma);
    fechaExpiracion.setDate(fechaExpiracion.getDate() + this.data.validezDias);

    const validezText = `Proforma válida ${this.data.validezDias} días. Expira: ${this.formatDate(fechaExpiracion.toISOString())}`;
    this.doc.text(validezText, this.style.margins.left, this.currentY);

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 5;
  }
}

export function generateProformaPDF(data: ProformaData, style?: PDFStyleConfig): ProformaTemplate {
  const template = new ProformaTemplate(data, style);
  template.generate();
  return template;
}
