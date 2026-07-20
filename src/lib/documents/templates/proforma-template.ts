import { FacturaTemplate } from './factura-template';
import { ProformaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import { EmpresaDocumentData } from './base-template';
import {
  buildDocumentIdentifier,
  generateIdentifierQRDataUrl
} from '../identifier';

/**
 * Template fiel al diseño de la Proforma MidCar (referencia 1740):
 *   - Título "PROFORMA"
 *   - "N.º de factura" + fecha
 *   - Bloques "Cliente:" / "Facturar a:"
 *   - Cabecera azul "Descripción del vehiculo"
 *   - Filas vehículo + fila adicional "Importe reserva"
 *   - Nota destacada: "Factura Proforma, No justifica la venta del vehículo,
 *     pendiente de hacer ingreso."
 *   - Totales con etiqueta "Total Proforma (EURO)"
 *   - "GRACIAS POR SU CONFIANZA"
 *   - Watermark "PROFORMA" gris diagonal
 *   - Banda inferior con identificador único MidCar + QR
 */
export class ProformaTemplate extends FacturaTemplate {
  protected data: ProformaData;

  constructor(
    data: ProformaData,
    style: PDFStyleConfig = DEFAULT_PDF_STYLE,
    empresa?: EmpresaDocumentData
  ) {
    // Inicializamos al constructor padre con un identifier proforma específico
    const dataConId: ProformaData = {
      ...data,
      identifier:
        data.identifier ||
        buildDocumentIdentifier({
          type: 'proforma',
          numeroDocumento: data.numeroProforma,
          vin: data.vehiculo.bastidor,
          dni: data.comprador.dni,
          fecha: data.fechaProforma
        })
    };
    super(dataConId, style, empresa);
    this.data = dataConId;
    this.tituloDocumento = 'PROFORMA';
    this.etiquetaTotal = 'Total Proforma (EURO)';
    this.etiquetaWatermark = 'PROFORMA';
  }

  public async ensureQRReady(): Promise<void> {
    if (!this.qrDataUrl) {
      this.qrDataUrl = await generateIdentifierQRDataUrl(this.identifier);
    }
  }

  public generate(): void {
    this.addTituloDocumento();
    this.addNumeroYFechaProforma();
    this.addBloquesFacturarA();
    this.addCabeceraAzul('Descripción del vehiculo');
    this.addFilasVehiculo();
    this.addBloqueTotales();
    this.addGraciasPorSuConfianza();
    this.applyMidCarOverlay();
  }

  // Etiqueta "N.º de factura" cambia por el número de proforma (manteniendo
  // el mismo wording que en el documento de referencia: "N.º de factura").
  protected addNumeroYFechaProforma(): void {
    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor(this.style.secondaryColor);
    this.doc.text('N.º de factura:', this.style.margins.left, this.currentY);
    this.doc.text(this.data.numeroProforma, this.style.margins.left + 35, this.currentY);

    this.doc.text('Fecha de la factura:', this.pageWidth - this.style.margins.right - 60, this.currentY);
    this.doc.text(
      this.formatShortDate(this.data.fechaProforma),
      this.pageWidth - this.style.margins.right - 20,
      this.currentY
    );

    this.currentY += 12;
  }

  // Inserta la fila "Importe reserva" antes de la separación
  protected addExtraFilas(): void {
    const importe = this.data.importeReserva ?? 0;
    this.checkPageBreak(6);
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text('Importe reserva:', this.style.margins.left, this.currentY);
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(
      importe.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €',
      this.style.margins.left + 40,
      this.currentY
    );
    this.currentY += 8;
  }

  // Antes del bloque de totales pintamos la nota destacada de la proforma
  protected preNotaProforma(): void {
    this.setFont(this.style.fontSize.normal, 'bold');
    this.setTextColor(this.style.secondaryColor);
    const nota =
      'Factura Proforma, No justifica la venta del vehículo, pendiente de hacer ingreso.';
    const w = this.doc.getTextWidth(nota);
    const x = (this.pageWidth - w) / 2;
    const y = this.currentY + 50;
    this.doc.text(nota, x, y);
  }
}

export function generateProformaPDF(
  data: ProformaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): ProformaTemplate {
  const template = new ProformaTemplate(data, style, empresa);
  template.generate();
  return template;
}

export async function generateProformaPDFWithQR(
  data: ProformaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): Promise<ProformaTemplate> {
  const template = new ProformaTemplate(data, style, empresa);
  await template.ensureQRReady();
  template.generate();
  return template;
}
