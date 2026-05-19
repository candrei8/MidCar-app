import { BaseDocumentTemplate, EmpresaDocumentData } from './base-template';
import { CompraventaData, PDFStyleConfig } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import {
  CLAUSULAS_COMPRAVENTA,
  TITULO_COMPRAVENTA,
  TEXTO_EXPONEN_COMPRAVENTA,
  TEXTO_ANEXO_COMPRAVENTA,
  TEXTO_MANIFESTACIONES_COMPRADOR,
  TEXTO_LEGAL_CAPACIDAD_COMPRAVENTA,
  TEXTO_CIERRE_COMPRAVENTA,
  NOTA_PIE_PAGINA_COMPRAVENTA
} from '../clauses/compraventa-clauses';
import {
  buildDocumentIdentifier,
  generateIdentifierQRDataUrl
} from '../identifier';

export class CompraventaTemplate extends BaseDocumentTemplate {
  private data: CompraventaData;
  private identifier: string;
  private qrDataUrl: string | undefined;

  constructor(
    data: CompraventaData,
    style: PDFStyleConfig = DEFAULT_PDF_STYLE,
    empresa?: EmpresaDocumentData
  ) {
    super(style, empresa);
    this.data = data;
    this.identifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'compraventa',
        numeroDocumento: data.numeroContrato || `CV-${new Date().getFullYear()}-0001`,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaContrato
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

  public generate(): void {
    this.addDocumentTitle();
    this.addContractLocationDate();
    this.addReunidos();
    this.addExponen();
    this.addVehiculoBloque();
    this.addAnexoMention();
    this.addManifestacionesComprador();
    this.addITV();
    this.addCapacidadLegal();
    this.addEstipulacionesSection();
    this.addCierre();
    this.addEquipamientoChecklist();
    this.addSignatureBoxes();
    this.applyMidCarOverlay();
  }

  public getIdentifier(): string {
    return this.identifier;
  }

  // ===========================================================================
  // SECCIONES
  // ===========================================================================
  private addDocumentTitle(): void {
    this.setFont(13, 'bold');
    this.setTextColor(this.style.secondaryColor);
    const titleLines = this.doc.splitTextToSize(TITULO_COMPRAVENTA, this.contentWidth);
    for (const line of titleLines) {
      const w = this.doc.getTextWidth(line);
      this.doc.text(line, (this.pageWidth - w) / 2, this.currentY);
      this.currentY += 6;
    }
    this.currentY += 4;
  }

  private addContractLocationDate(): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    const lugar = this.data.lugarContrato || this.empresa.localidad;
    const text = `En `;
    const textWidth = this.doc.getTextWidth(text);
    this.doc.text(text, this.style.margins.left, this.currentY);
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(lugar, this.style.margins.left + textWidth, this.currentY);
    const lugarWidth = this.doc.getTextWidth(lugar);
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(
      ` a ${this.formatDate(this.data.fechaContrato)}`,
      this.style.margins.left + textWidth + lugarWidth,
      this.currentY
    );
    this.currentY += 8;
  }

  private addReunidos(): void {
    this.checkPageBreak(40);
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'REUNIDOS';
    const tw = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - tw) / 2, this.currentY);
    this.currentY += 8;

    this.addParteParrafo('De una parte, ', this.data.vendedor, 'VENDEDOR');
    this.addLineBreak(2);
    this.addParteParrafo('De otra parte, ', this.data.comprador, 'COMPRADOR');
    this.addLineBreak(2);
  }

  private addParteParrafo(
    introduccion: string,
    persona: import('../document-types').CustomerData,
    rol: 'VENDEDOR' | 'COMPRADOR'
  ): void {
    const nombre = persona.isEmpresa
      ? (persona.nombreEmpresa || '').toUpperCase()
      : `${persona.nombre} ${persona.apellidos}`.toUpperCase();
    const docType = persona.isEmpresa
      ? `CIF: ${persona.cifEmpresa}`
      : `NIE: ${persona.dni}`;
    const direccion = `${persona.direccion}, ${persona.codigoPostal}, ${persona.localidad}, ${persona.provincia}`;

    // Renderizamos el párrafo con énfasis (bold) en nombre, NIE/CIF, dirección y rol
    this.setFont(this.style.fontSize.normal, 'normal');
    const segments: Array<{ text: string; bold: boolean }> = [
      { text: introduccion, bold: false },
      { text: nombre, bold: true },
      { text: ', con ', bold: false },
      { text: docType, bold: true },
      { text: ', con domicilio en ', bold: false },
      { text: direccion, bold: true },
      { text: ', actuando en calidad de ', bold: false },
      { text: rol + '.', bold: true }
    ];
    this.renderInlineSegments(segments);
  }

  private renderInlineSegments(segments: Array<{ text: string; bold: boolean }>): void {
    const maxWidth = this.contentWidth;
    let lineWidth = 0;
    let lineFragments: Array<{ text: string; bold: boolean; width: number }> = [];

    const flushLine = () => {
      let x = this.style.margins.left;
      this.checkPageBreak(6);
      for (const frag of lineFragments) {
        this.setFont(this.style.fontSize.normal, frag.bold ? 'bold' : 'normal');
        this.doc.text(frag.text, x, this.currentY);
        x += frag.width;
      }
      this.currentY += 5;
      lineWidth = 0;
      lineFragments = [];
    };

    for (const seg of segments) {
      const words = seg.text.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        this.setFont(this.style.fontSize.normal, seg.bold ? 'bold' : 'normal');
        const w = this.doc.getTextWidth(word);
        if (lineWidth + w > maxWidth && lineFragments.length > 0) {
          flushLine();
          if (/^\s+$/.test(word)) continue;
        }
        lineFragments.push({ text: word, bold: seg.bold, width: w });
        lineWidth += w;
      }
    }
    if (lineFragments.length) flushLine();
  }

  private addExponen(): void {
    this.checkPageBreak(20);
    this.addLineBreak(2);
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'EXPONEN:';
    const tw = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - tw) / 2, this.currentY);
    this.currentY += 8;

    this.addParagraph(TEXTO_EXPONEN_COMPRAVENTA);
  }

  private addVehiculoBloque(): void {
    const v = this.data.vehiculo;
    const filas = [
      { l: 'Tipo:', v: 'Turismo' },
      { l: 'Modelo:', v: `${v.marca} ${v.modelo}${v.version ? ' ' + v.version : ''}` },
      { l: 'Color:', v: v.color || '___' },
      { l: 'Matrícula:', v: v.matricula },
      { l: 'N.º de Bastidor:', v: v.bastidor },
      { l: 'Antigüedad (Fecha 1º Matriculación):', v: this.formatShortDate(v.fechaMatriculacion) },
      { l: 'Kilometraje:', v: v.kilometros.toLocaleString('es-ES') },
      { l: 'Llaves:', v: this.data.numLlaves ? String(this.data.numLlaves) : '___' }
    ];

    this.checkPageBreak(filas.length * 5 + 6);
    for (const f of filas) {
      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(f.l + ' ' + f.v, this.style.margins.left + 5, this.currentY);
      this.currentY += 5;
    }
    this.addLineBreak(2);
  }

  private addAnexoMention(): void {
    this.addParagraph(TEXTO_ANEXO_COMPRAVENTA);
  }

  private addManifestacionesComprador(): void {
    this.checkPageBreak(20);
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(TEXTO_MANIFESTACIONES_COMPRADOR, this.style.margins.left, this.currentY);
    this.currentY += 6;

    const examinado = this.data.examinadoPersonalmente;
    const probado = this.data.probadoVehiculo;
    this.addCheckLine('Ha examinado personal y directamente el vehículo.', examinado);
    this.addCheckLine('Ha probado el vehículo.', probado);
    this.addLineBreak(2);
  }

  private addCheckLine(label: string, value?: boolean): void {
    this.setFont(this.style.fontSize.normal, 'normal');
    const siBox = value === true ? '☒' : '☐';
    const noBox = value === false ? '☒' : '☐';
    this.doc.text(`${siBox} SI   ${noBox} NO   ${label}`, this.style.margins.left + 5, this.currentY);
    this.currentY += 5;
  }

  private addITV(): void {
    if (!this.data.fechaITV && !this.data.resultadoITV) return;
    const fecha = this.data.fechaITV ? this.formatShortDate(this.data.fechaITV) : '___';
    const resultado = this.data.resultadoITV || '___';
    const proxima = this.data.proximaITV ? this.formatShortDate(this.data.proximaITV) : '___';
    const text =
      `IV.- Que el vehículo objeto de la presente compraventa se encuentra revisado ` +
      `reglamentariamente por la ITV en fecha ${fecha} con el resultado de ${resultado}. ` +
      `La próxima inspección de ITV se debe realizar en ${proxima}.`;
    this.addParagraph(text);
  }

  private addCapacidadLegal(): void {
    this.addParagraph(TEXTO_LEGAL_CAPACIDAD_COMPRAVENTA);
  }

  private addEstipulacionesSection(): void {
    this.checkPageBreak(20);
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'ESTIPULACIONES';
    const tw = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - tw) / 2, this.currentY);
    this.currentY += 8;

    const vendedor = this.normalizedName(this.data.vendedor);
    const comprador = this.normalizedName(this.data.comprador);
    const precio = this.formatCurrencyPlain(this.data.condiciones.totalConIva);
    const garantia = String(this.data.garantia?.meses ?? 12);

    for (const clausula of CLAUSULAS_COMPRAVENTA) {
      this.checkPageBreak(30);
      const contenido = clausula.contenido
        .replace(/{{VENDEDOR}}/g, vendedor)
        .replace(/{{COMPRADOR}}/g, comprador)
        .replace(/{{PRECIO}}/g, precio + ' €')
        .replace(/{{MESES_GARANTIA}}/g, garantia);

      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(`${clausula.numero}.`, this.style.margins.left, this.currentY);
      const labelW = this.doc.getTextWidth(`${clausula.numero}.  `);
      this.setFont(this.style.fontSize.normal, 'normal');

      // separar en líneas con sangría tras la etiqueta
      const firstParagraph = contenido.split('\n')[0];
      const rest = contenido.split('\n').slice(1);
      const firstLines = this.doc.splitTextToSize(firstParagraph, this.contentWidth - labelW);
      this.doc.text(firstLines[0], this.style.margins.left + labelW, this.currentY);
      this.currentY += 5;
      for (let i = 1; i < firstLines.length; i++) {
        this.checkPageBreak(6);
        this.doc.text(firstLines[i], this.style.margins.left, this.currentY);
        this.currentY += 5;
      }
      for (const para of rest) {
        const lines = this.doc.splitTextToSize(para, this.contentWidth);
        for (const line of lines) {
          this.checkPageBreak(6);
          this.doc.text(line, this.style.margins.left, this.currentY);
          this.currentY += 5;
        }
      }
      this.addLineBreak(2);
    }

    // Nota a pie de página de la SÉPTIMA
    this.checkPageBreak(12);
    this.setFont(this.style.fontSize.small, 'bold');
    const notaLines = this.doc.splitTextToSize(NOTA_PIE_PAGINA_COMPRAVENTA, this.contentWidth);
    for (const line of notaLines) {
      this.checkPageBreak(5);
      this.doc.text(line, this.style.margins.left, this.currentY);
      this.currentY += 4;
    }
    this.addLineBreak(3);
  }

  private addCierre(): void {
    this.addParagraph(TEXTO_CIERRE_COMPRAVENTA);
  }

  private addEquipamientoChecklist(): void {
    this.checkPageBreak(40);
    this.addLineBreak(2);
    const eq = this.data.equipamiento || {
      fichaTecnica: false,
      garantia: false,
      chaleco: false,
      antena: false,
      ruedaRepuesto: false,
      kitReparacion: false,
      llaveRuedas: false,
      llaveAntirrobo: false,
      gancho: false,
      gato: false,
      triangulos: false,
      tapacubos: false
    };

    const columnas: Array<Array<{ label: string; value: boolean }>> = [
      [
        { label: 'FICHA TECNICA', value: eq.fichaTecnica },
        { label: 'GARANTIA', value: eq.garantia },
        { label: 'CHALECO', value: eq.chaleco },
        { label: 'ANTENA', value: eq.antena }
      ],
      [
        { label: 'RUEDA DE REPUESTO', value: eq.ruedaRepuesto },
        { label: 'KIT DE REPARACIÓN', value: eq.kitReparacion },
        { label: 'LLAVE RUEDAS', value: eq.llaveRuedas },
        { label: 'LLAVE ANTIRROBO', value: eq.llaveAntirrobo }
      ],
      [
        { label: 'GANCHO', value: eq.gancho },
        { label: 'GATO', value: eq.gato },
        { label: 'TRIÁNGULOS', value: eq.triangulos },
        { label: 'TAPACUBOS', value: eq.tapacubos }
      ]
    ];

    const colWidth = this.contentWidth / 3;
    const baseY = this.currentY;
    let maxRows = 0;
    for (let c = 0; c < columnas.length; c++) {
      let rowY = baseY;
      maxRows = Math.max(maxRows, columnas[c].length);
      for (const item of columnas[c]) {
        const box = item.value ? '☒' : '☐';
        this.setFont(this.style.fontSize.normal, 'bold');
        this.doc.text(
          `${box}  ${item.label}`,
          this.style.margins.left + c * colWidth,
          rowY
        );
        rowY += 6;
      }
    }
    this.currentY = baseY + maxRows * 6 + 4;
  }

  private addSignatureBoxes(): void {
    this.checkPageBreak(55);
    this.addLineBreak(4);
    const boxW = (this.contentWidth - 10) / 2;
    const boxH = 40;
    const leftX = this.style.margins.left;
    const rightX = leftX + boxW + 10;
    const topY = this.currentY;

    // Caja izquierda (vendedor)
    this.doc.setDrawColor(120, 120, 120);
    this.doc.rect(leftX, topY, boxW, boxH);
    this.setFont(this.style.fontSize.normal, 'bold');
    const labelV = 'VENDEDOR';
    const labelVw = this.doc.getTextWidth(labelV);
    this.doc.text(labelV, leftX + (boxW - labelVw) / 2, topY + 6);
    const nombreV = this.normalizedName(this.data.vendedor);
    const nameVw = this.doc.getTextWidth(nombreV);
    this.doc.text(nombreV, leftX + (boxW - nameVw) / 2, topY + 12);

    // Caja derecha (comprador)
    this.doc.rect(rightX, topY, boxW, boxH);
    this.setFont(this.style.fontSize.normal, 'bold');
    const labelC = 'Comprador (NOMBRE, FIRMA Y DNI)';
    const labelCw = this.doc.getTextWidth(labelC);
    this.doc.text(labelC, rightX + (boxW - labelCw) / 2, topY + 6);

    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text('Nombre: ____________________________________', rightX + 3, topY + 16);
    this.doc.text('DNI: _______________________________________', rightX + 3, topY + 24);
    this.doc.text('Firma:', rightX + 3, topY + 33);

    this.currentY = topY + boxH + 8;
  }

  private applyMidCarOverlay(): void {
    this.addWatermark('CONTRATO');
    this.addMidCarIdentifierStrip(this.identifier, this.qrDataUrl);
  }

  private normalizedName(p: import('../document-types').CustomerData): string {
    if (p.isEmpresa) return (p.nombreEmpresa || '').toUpperCase();
    return `${p.nombre} ${p.apellidos}`.toUpperCase();
  }

  private formatShortDate(d: string): string {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = date.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  private formatCurrencyPlain(amount: number): string {
    return amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function generateCompraventaPDF(
  data: CompraventaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): CompraventaTemplate {
  const template = new CompraventaTemplate(data, style, empresa);
  template.generate();
  return template;
}

export async function generateCompraventaPDFWithQR(
  data: CompraventaData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): Promise<CompraventaTemplate> {
  const template = new CompraventaTemplate(data, style, empresa);
  await template.ensureQRReady();
  template.generate();
  return template;
}
