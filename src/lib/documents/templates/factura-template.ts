import { BaseDocumentTemplate } from './base-template';
import { FacturaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE, EMPRESA_DATOS } from '../constants';

export class FacturaTemplate extends BaseDocumentTemplate {
  protected data: FacturaData;

  constructor(data: FacturaData, style: PDFStyleConfig = DEFAULT_PDF_STYLE) {
    super(style);
    this.data = data;
  }

  public generate(): void {
    this.addHeader();
    this.addFacturaHeader();
    this.addClienteData();
    this.addVehicleDescription();
    this.addDesgloseEconomico();
    this.addFormaPago();
    this.addNotasLegales();
  }

  protected addFacturaHeader(): void {
    // Título de factura con número
    this.setFont(20, 'bold');
    this.setTextColor(this.style.primaryColor);
    this.doc.text('FACTURA', this.style.margins.left, this.currentY);

    // Número y fecha en la derecha
    const rightX = this.pageWidth - this.style.margins.right;
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(`Nº: ${this.data.numeroFactura}`, rightX - 50, this.currentY - 5, { align: 'left' });
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(`Fecha: ${this.formatDate(this.data.fechaFactura)}`, rightX - 50, this.currentY + 2, { align: 'left' });

    this.setTextColor(this.style.secondaryColor);
    this.currentY += 15;

    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.style.margins.left, this.currentY, this.pageWidth - this.style.margins.right, this.currentY);
    this.currentY += 10;
  }

  protected addClienteData(): void {
    const startY = this.currentY;

    // Datos del emisor (izquierda)
    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([128, 128, 128]);
    this.doc.text('EMISOR', this.style.margins.left, this.currentY);
    this.currentY += 5;

    this.setFont(this.style.fontSize.normal, 'normal');
    this.setTextColor(this.style.secondaryColor);
    this.doc.text(EMPRESA_DATOS.nombre, this.style.margins.left, this.currentY);
    this.currentY += 5;
    this.doc.text(`CIF: ${EMPRESA_DATOS.cif}`, this.style.margins.left, this.currentY);
    this.currentY += 5;
    this.doc.text(EMPRESA_DATOS.direccion, this.style.margins.left, this.currentY);
    this.currentY += 5;
    this.doc.text(`${EMPRESA_DATOS.codigoPostal} ${EMPRESA_DATOS.localidad}`, this.style.margins.left, this.currentY);

    // Datos del cliente (derecha)
    const rightX = this.pageWidth / 2 + 10;
    let clienteY = startY;

    this.setFont(this.style.fontSize.small, 'bold');
    this.setTextColor([128, 128, 128]);
    this.doc.text('CLIENTE', rightX, clienteY);
    clienteY += 5;

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
    clienteY += 5;
    this.doc.text(identificacion, rightX, clienteY);
    clienteY += 5;
    this.doc.text(cliente.direccion, rightX, clienteY);
    clienteY += 5;
    this.doc.text(`${cliente.codigoPostal} ${cliente.localidad} (${cliente.provincia})`, rightX, clienteY);

    this.currentY = Math.max(this.currentY, clienteY) + 15;
  }

  protected addVehicleDescription(): void {
    // Encabezado de tabla
    this.setFillColor(this.style.primaryColor);
    this.doc.rect(this.style.margins.left, this.currentY - 5, this.contentWidth, 10, 'F');

    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor([255, 255, 255]);
    this.doc.text('DESCRIPCIÓN', this.style.margins.left + 5, this.currentY + 1);
    this.setTextColor(this.style.secondaryColor);
    this.currentY += 10;

    // Descripción del vehículo
    const vehiculo = this.data.vehiculo;
    const descripcion = `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.version ? ' ' + vehiculo.version : ''}`;
    const detalles = [
      `Matrícula: ${vehiculo.matricula}`,
      `Bastidor: ${vehiculo.bastidor}`,
      `Fecha matriculación: ${vehiculo.fechaMatriculacion}`,
      `Kilómetros: ${vehiculo.kilometros.toLocaleString('es-ES')} km`,
      `Combustible: ${vehiculo.combustible}`
    ];

    // Fondo alternado
    this.setFillColor([248, 250, 252]);
    this.doc.rect(this.style.margins.left, this.currentY - 4, this.contentWidth, 35, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(this.style.margins.left, this.currentY - 4, this.contentWidth, 35, 'S');

    this.setFont(this.style.fontSize.subtitle, 'bold');
    this.doc.text(descripcion, this.style.margins.left + 5, this.currentY + 2);
    this.currentY += 8;

    this.setFont(this.style.fontSize.normal, 'normal');
    for (const detalle of detalles) {
      this.doc.text(detalle, this.style.margins.left + 5, this.currentY);
      this.currentY += 5;
    }

    // Concepto adicional si existe
    if (this.data.conceptoAdicional) {
      this.currentY += 5;
      this.setFillColor([255, 255, 255]);
      this.doc.rect(this.style.margins.left, this.currentY - 4, this.contentWidth, 10, 'F');
      this.doc.setDrawColor(226, 232, 240);
      this.doc.rect(this.style.margins.left, this.currentY - 4, this.contentWidth, 10, 'S');
      this.doc.text(this.data.conceptoAdicional, this.style.margins.left + 5, this.currentY + 2);
      this.currentY += 10;
    }

    this.currentY += 10;
  }

  protected addDesgloseEconomico(): void {
    const cond = this.data.condiciones;
    const rightX = this.pageWidth - this.style.margins.right - 80;

    // Caja de desglose
    this.setFillColor([248, 250, 252]);
    this.doc.rect(rightX - 10, this.currentY - 5, 90, 50, 'F');
    this.doc.setDrawColor(226, 232, 240);
    this.doc.rect(rightX - 10, this.currentY - 5, 90, 50, 'S');

    // Base imponible
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text('Base imponible:', rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.baseImponible), rightX + 70, this.currentY, { align: 'right' });
    this.currentY += 8;

    // IVA
    this.doc.text(`IVA (${cond.ivaPercent}%):`, rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.ivaImporte), rightX + 70, this.currentY, { align: 'right' });
    this.currentY += 8;

    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(rightX, this.currentY, rightX + 70, this.currentY);
    this.currentY += 8;

    // Total
    this.setFont(this.style.fontSize.subtitle, 'bold');
    this.setTextColor(this.style.primaryColor);
    this.doc.text('TOTAL:', rightX, this.currentY);
    this.doc.text(this.formatCurrency(cond.totalConIva), rightX + 70, this.currentY, { align: 'right' });
    this.setTextColor(this.style.secondaryColor);

    this.currentY += 20;
  }

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

    this.addLineBreak(10);
  }

  protected addNotasLegales(): void {
    this.setFont(this.style.fontSize.small, 'normal');
    this.setTextColor([128, 128, 128]);

    const notas = [
      'Factura expedida conforme a la Ley 37/1992 del IVA y el R.D. 1619/2012 de facturación.',
      `Inscrita en el Registro Mercantil de ${EMPRESA_DATOS.provincia}.`
    ];

    for (const nota of notas) {
      this.doc.text(nota, this.style.margins.left, this.currentY);
      this.currentY += 4;
    }

    this.setTextColor(this.style.secondaryColor);
  }
}

export function generateFacturaPDF(data: FacturaData, style?: PDFStyleConfig): FacturaTemplate {
  const template = new FacturaTemplate(data, style);
  template.generate();
  return template;
}
