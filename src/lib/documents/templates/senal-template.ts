import { BaseDocumentTemplate, EmpresaDocumentData } from './base-template';
import { SenalData, PDFStyleConfig, CustomerData } from '../document-types';
import { DEFAULT_PDF_STYLE } from '../constants';
import {
  CLAUSULAS_SENAL,
  TITULO_SENAL,
  TEXTO_RECONOCIMIENTO_SENAL,
  TEXTO_MANIFIESTAN_SENAL_I,
  TEXTO_MANIFIESTAN_SENAL_II,
  TEXTO_CIERRE_SENAL,
  TEXTO_LOPD_SENAL
} from '../clauses/senal-clauses';
import {
  buildDocumentIdentifier,
  generateIdentifierQRDataUrl
} from '../identifier';

const NUMERO_A_LETRAS_MAX = 1_000_000_000;

function numeroALetras(n: number): string {
  if (n >= NUMERO_A_LETRAS_MAX) return n.toString();
  const entero = Math.floor(n);
  const decimal = Math.round((n - entero) * 100);
  const enteroLetras = enteroALetras(entero);
  const partes = [enteroLetras + ' Euros'];
  if (decimal > 0) partes.push('con ' + enteroALetras(decimal) + ' céntimos');
  return capitalizarPalabras(partes.join(' '));
}

function capitalizarPalabras(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function enteroALetras(n: number): string {
  if (n === 0) return 'cero';
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales: Record<number, string> = {
    10: 'diez', 11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    20: 'veinte', 30: 'treinta', 40: 'cuarenta', 50: 'cincuenta',
    60: 'sesenta', 70: 'setenta', 80: 'ochenta', 90: 'noventa'
  };
  const centenas: Record<number, string> = {
    100: 'cien', 200: 'doscientos', 300: 'trescientos', 400: 'cuatrocientos',
    500: 'quinientos', 600: 'seiscientos', 700: 'setecientos', 800: 'ochocientos', 900: 'novecientos'
  };

  if (n < 10) return unidades[n];
  if (n < 30) {
    if (especiales[n]) return especiales[n];
    if (n < 16) return 'dieci' + unidades[n - 10];
    return 'veinti' + unidades[n - 20];
  }
  if (n < 100) {
    const dec = Math.floor(n / 10) * 10;
    const uni = n % 10;
    if (especiales[n]) return especiales[n];
    return especiales[dec] + (uni ? ' y ' + unidades[uni] : '');
  }
  if (n < 1000) {
    const cen = Math.floor(n / 100) * 100;
    const resto = n % 100;
    const cenStr = resto === 0 && cen === 100 ? 'cien' : centenas[cen].replace('cien', 'ciento');
    return cenStr + (resto ? ' ' + enteroALetras(resto) : '');
  }
  if (n < 1_000_000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    const milesStr = miles === 1 ? 'mil' : enteroALetras(miles) + ' mil';
    return milesStr + (resto ? ' ' + enteroALetras(resto) : '');
  }
  const millones = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const millonesStr = millones === 1 ? 'un millón' : enteroALetras(millones) + ' millones';
  return millonesStr + (resto ? ' ' + enteroALetras(resto) : '');
}

export class SenalTemplate extends BaseDocumentTemplate {
  private data: SenalData;
  private identifier: string;
  private qrDataUrl: string | undefined;

  constructor(
    data: SenalData,
    style: PDFStyleConfig = DEFAULT_PDF_STYLE,
    empresa?: EmpresaDocumentData
  ) {
    super(style, empresa);
    this.data = data;
    this.identifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'senal',
        numeroDocumento: data.numeroSenal || `SN-${new Date().getFullYear()}-0001`,
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
    this.addTitulo();
    this.addLugarFechaHora();
    this.addReunidos();
    this.addReconocimiento();
    this.addManifiestan();
    this.addEstipulaciones();
    this.addCierre();
    this.addLOPD();
    this.addFirmas();
    this.applyMidCarOverlay();
  }

  public getIdentifier(): string {
    return this.identifier;
  }

  // ===========================================================================
  // SECCIONES
  // ===========================================================================
  private addTitulo(): void {
    this.setFont(13, 'bold');
    this.setTextColor(this.style.secondaryColor);
    const w = this.doc.getTextWidth(TITULO_SENAL);
    this.doc.text(TITULO_SENAL, (this.pageWidth - w) / 2, this.currentY);
    this.currentY += 8;
  }

  private addLugarFechaHora(): void {
    const lugar = this.data.lugarContrato || this.empresa.localidad;
    const fecha = this.formatLongDate(this.data.fechaContrato);
    const hora = this.data.horaContrato ? ` a las ${this.data.horaContrato} horas` : '';
    const prefix = 'En';
    const text = ` a ${fecha}${hora}`;
    this.setFont(this.style.fontSize.normal, 'normal');
    const totalWidth =
      this.doc.getTextWidth(prefix + ' ') +
      (() => {
        this.setFont(this.style.fontSize.normal, 'bold');
        const w = this.doc.getTextWidth(lugar);
        this.setFont(this.style.fontSize.normal, 'normal');
        return w;
      })() +
      this.doc.getTextWidth(text);
    const x = this.pageWidth - this.style.margins.right - totalWidth;

    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(prefix + ' ', x, this.currentY);
    let cursor = x + this.doc.getTextWidth(prefix + ' ');
    this.setFont(this.style.fontSize.normal, 'bold');
    this.doc.text(lugar, cursor, this.currentY);
    cursor += this.doc.getTextWidth(lugar);
    this.setFont(this.style.fontSize.normal, 'normal');
    this.doc.text(text, cursor, this.currentY);
    this.currentY += 10;
  }

  private addReunidos(): void {
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'REUNIDOS';
    const w = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - w) / 2, this.currentY);
    this.currentY += 8;

    this.addParteParrafo('DE UNA PARTE, ', this.data.vendedor, 'VENDEDOR');
    this.addLineBreak(2);
    this.addParteParrafo('Y DE OTRA PARTE, ', this.data.comprador, 'COMPRADOR');
    this.addLineBreak(2);
  }

  private addParteParrafo(intro: string, persona: CustomerData, rol: 'VENDEDOR' | 'COMPRADOR'): void {
    const nombre = persona.isEmpresa
      ? (persona.nombreEmpresa || '').toUpperCase()
      : `${persona.nombre} ${persona.apellidos}`.toUpperCase();
    const docType = persona.isEmpresa
      ? `CIF ${persona.cifEmpresa}`
      : `NIE ${persona.dni}`;
    const direccion = `${persona.direccion}, ${persona.codigoPostal}, ${persona.localidad}, ${persona.provincia}`;
    const segments: Array<{ text: string; bold: boolean }> = [
      { text: intro, bold: false },
      { text: nombre, bold: true },
      { text: ', con ', bold: false },
      { text: docType, bold: true },
      { text: ', con domicilio en ', bold: false },
      { text: direccion, bold: true },
      { text: '. En adelante el ', bold: false },
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

  private addReconocimiento(): void {
    this.addParagraph(TEXTO_RECONOCIMIENTO_SENAL);
  }

  private addManifiestan(): void {
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'MANIFIESTAN';
    const w = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - w) / 2, this.currentY);
    this.currentY += 8;

    // I.- ...
    this.addParagraph(TEXTO_MANIFIESTAN_SENAL_I);

    // Listado de características con check marks
    const v = this.data.vehiculo;
    const items: Array<{ k: string; val: string; bold?: boolean }> = [
      { k: 'Matrícula', val: v.matricula, bold: true },
      { k: 'Marca y tipo', val: `${v.marca} ${v.modelo}${v.version ? ' ' + v.version : ''}`, bold: true },
      { k: 'Número de bastidor', val: v.bastidor, bold: true },
      { k: 'Kilometraje', val: v.kilometros.toLocaleString('es-ES'), bold: false },
      { k: 'Cantidad señal', val: this.formatEuro(this.data.importeSenal), bold: false },
      { k: 'Precio Total de la Compraventa', val: this.formatEuro(this.data.precioTotal), bold: true },
      { k: 'Número de cuenta', val: this.data.cuentaBancaria, bold: true }
    ];

    for (const item of items) {
      this.checkPageBreak(6);
      this.setFont(this.style.fontSize.normal, 'normal');
      this.doc.text('✓', this.style.margins.left + 5, this.currentY);
      this.setFont(this.style.fontSize.normal, 'normal');
      this.doc.text(`${item.k}: `, this.style.margins.left + 10, this.currentY);
      const labelW = this.doc.getTextWidth(`${item.k}: `);
      this.setFont(this.style.fontSize.normal, item.bold ? 'bold' : 'normal');
      this.doc.text(item.val, this.style.margins.left + 10 + labelW, this.currentY);
      this.currentY += 5;
    }
    this.addLineBreak(2);

    // II.- ...
    this.addParagraph(TEXTO_MANIFIESTAN_SENAL_II);
  }

  private addEstipulaciones(): void {
    this.checkPageBreak(20);
    this.setFont(this.style.fontSize.subtitle, 'bold');
    const title = 'ESTIPULACIONES';
    const w = this.doc.getTextWidth(title);
    this.doc.text(title, (this.pageWidth - w) / 2, this.currentY);
    this.currentY += 8;

    const precioPlain = this.formatNumber(this.data.precioTotal);
    const precioLetras = numeroALetras(this.data.precioTotal);
    const jurisdiccion = this.data.lugarContrato || this.empresa.localidad;

    for (const clausula of CLAUSULAS_SENAL) {
      this.checkPageBreak(30);
      const contenido = clausula.contenido
        .replace(/{{PRECIO_LETRAS}}/g, precioLetras)
        .replace(/{{PRECIO}}/g, precioPlain + ' €')
        .replace(/{{JURISDICCION}}/g, jurisdiccion);

      this.setFont(this.style.fontSize.normal, 'bold');
      this.doc.text(`${clausula.numero}.-`, this.style.margins.left, this.currentY);
      const labelW = this.doc.getTextWidth(`${clausula.numero}.-  `);
      this.setFont(this.style.fontSize.normal, 'normal');

      const paragraphs = contenido.split('\n');
      const firstLines = this.doc.splitTextToSize(paragraphs[0], this.contentWidth - labelW);
      this.doc.text(firstLines[0], this.style.margins.left + labelW, this.currentY);
      this.currentY += 5;
      for (let i = 1; i < firstLines.length; i++) {
        this.checkPageBreak(6);
        this.doc.text(firstLines[i], this.style.margins.left, this.currentY);
        this.currentY += 5;
      }
      for (const para of paragraphs.slice(1)) {
        const lines = this.doc.splitTextToSize(para, this.contentWidth);
        for (const line of lines) {
          this.checkPageBreak(6);
          this.doc.text(line, this.style.margins.left, this.currentY);
          this.currentY += 5;
        }
      }
      this.addLineBreak(2);
    }
  }

  private addCierre(): void {
    this.addParagraph(TEXTO_CIERRE_SENAL);
  }

  private addLOPD(): void {
    this.checkPageBreak(20);
    const vendedor = this.normalizedName(this.data.vendedor);
    const direccion = `${this.data.vendedor.direccion}, ${this.data.vendedor.codigoPostal}, ${this.data.vendedor.localidad}, ${this.data.vendedor.provincia}`;
    const texto = TEXTO_LOPD_SENAL
      .replace(/{{VENDEDOR}}/g, vendedor)
      .replace(/{{DIRECCION_VENDEDOR}}/g, direccion);

    this.setFont(this.style.fontSize.small, 'italic');
    this.setTextColor([90, 90, 90]);
    const lines = this.doc.splitTextToSize(texto, this.contentWidth);
    for (const line of lines) {
      this.checkPageBreak(5);
      this.doc.text(line, this.style.margins.left, this.currentY);
      this.currentY += 4;
    }
    this.setTextColor(this.style.secondaryColor);
    this.addLineBreak(5);
  }

  private addFirmas(): void {
    this.checkPageBreak(40);
    const lineY = this.currentY + 15;
    const lineWidth = 70;
    const leftX = this.style.margins.left + 5;
    const rightX = this.pageWidth - this.style.margins.right - lineWidth - 5;

    this.doc.setDrawColor(120, 120, 120);
    this.doc.line(leftX, lineY, leftX + lineWidth, lineY);
    this.doc.line(rightX, lineY, rightX + lineWidth, lineY);

    this.setFont(this.style.fontSize.normal, 'bold');
    const v = this.normalizedName(this.data.vendedor);
    const c = this.normalizedName(this.data.comprador);
    const vw = this.doc.getTextWidth(v);
    const cw = this.doc.getTextWidth(c);
    this.doc.text(v, leftX + (lineWidth - vw) / 2, lineY + 5);
    this.doc.text(c, rightX + (lineWidth - cw) / 2, lineY + 5);

    this.setFont(this.style.fontSize.normal, 'normal');
    const subV = 'VENDEDOR';
    const subC = 'Comprador (FIRMA Y DNI)';
    const subVw = this.doc.getTextWidth(subV);
    const subCw = this.doc.getTextWidth(subC);
    this.doc.text(subV, leftX + (lineWidth - subVw) / 2, lineY + 10);
    this.doc.text(subC, rightX + (lineWidth - subCw) / 2, lineY + 10);

    this.currentY = lineY + 15;
  }

  private applyMidCarOverlay(): void {
    this.addWatermark('CONTRATO');
    this.addMidCarIdentifierStrip(this.identifier, this.qrDataUrl);
  }

  private normalizedName(p: CustomerData): string {
    if (p.isEmpresa) return (p.nombreEmpresa || '').toUpperCase();
    return `${p.nombre} ${p.apellidos}`.toUpperCase();
  }

  private formatNumber(n: number): string {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatEuro(n: number): string {
    return this.formatNumber(n) + ' €';
  }

  private formatLongDate(d: string): string {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }
}

export function generateSenalPDF(
  data: SenalData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): SenalTemplate {
  const template = new SenalTemplate(data, style, empresa);
  template.generate();
  return template;
}

export async function generateSenalPDFWithQR(
  data: SenalData,
  style?: PDFStyleConfig,
  empresa?: EmpresaDocumentData
): Promise<SenalTemplate> {
  const template = new SenalTemplate(data, style, empresa);
  await template.ensureQRReady();
  template.generate();
  return template;
}
