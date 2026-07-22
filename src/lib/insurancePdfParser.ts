/**
 * insurancePdfParser.ts
 *
 * Extracción de pólizas desde el PDF que envía la aseguradora (AXA, etc.).
 * Se procesa íntegramente en el navegador en dos fases:
 *
 *  1. Capa de texto de pdf.js: se reconstruyen las líneas y se detectan las
 *     matrículas españolas con regex.
 *  2. OCR de respaldo (tesseract.js): si el PDF no tiene texto utilizable —
 *     documentos escaneados o con fuentes incrustadas sin tabla ToUnicode,
 *     como los listados de flota de AXA, que extraen glifos ilegibles — se
 *     renderiza cada página a imagen y se reconocen las matrículas por OCR,
 *     con tolerancia a los errores típicos (O por 0, puntos intercalados).
 *
 * El resultado usa el mismo formato ParsedPolicy que la importación
 * Excel/CSV, de modo que reutiliza el matching con vehículos y el modal de
 * previsualización existentes.
 */

import { ParsedPolicy } from '@/components/insurance/ImportPreviewModal'
import { normalizeMatricula } from './insuranceFileParser'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Compañías conocidas para detectar la aseguradora en el texto del PDF
const ASEGURADORAS_CONOCIDAS = [
    'AXA', 'MAPFRE', 'ALLIANZ', 'GENERALI', 'ZURICH', 'REALE', 'PELAYO',
    'LINEA DIRECTA', 'LÍNEA DIRECTA', 'MUTUA MADRILEÑA', 'MUTUA MADRILENA',
    'CATALANA OCCIDENTE', 'OCASO', 'SANTALUCIA', 'SANTALUCÍA', 'HELVETIA',
    'LIBERTY', 'QUALITAS', 'BALUMBA', 'VERTI', 'GENESIS', 'FIATC', 'PLUS ULTRA'
]

// Matrícula española formato nuevo: 4 dígitos + 3 consonantes (sin vocales ni Ñ/Q)
const PLATE_NEW = /(?<![A-ZÑ0-9])(\d{4})[\s.-]?([BCDFGHJKLMNPRSTVWXYZ]{3})(?![A-ZÑ0-9])/g
const PLATE_LETTERS_RE = /^[BCDFGHJKLMNPRSTVWXYZ]{3}$/
// Falsos positivos habituales en pólizas: "AÑO 2015 BMW", "PMA 3500 KGS",
// "1.4 GLP"… — tríos de consonantes que son unidades, marcas o motores,
// nunca (en la práctica) el bloque de letras de una matrícula del documento
const PLATE_LETTER_BLOCKLIST = new Set([
    'KGS', 'KMS', 'CVS', 'PVP', 'RPM', 'BMW', 'KTM', 'TDI', 'TSI', 'THP',
    'HDI', 'CDI', 'DCI', 'CRD', 'JTD', 'GLP', 'GNC', 'PMA', 'MMA'
])
// Matrícula formato antiguo: M-1234-AB (con guiones) o M1234AB (compacta).
// La variante con espacios se excluye a propósito: dispara falsos positivos
// sistemáticos en prosa ("CLASE A 1800 CC", "PÓLIZA N 1234 EL…").
const PLATE_OLD_HYPHEN = /(?<![A-ZÑ0-9])([A-Z]{1,2})-(\d{4})-([A-Z]{1,2})(?![A-ZÑ0-9])/g
const PLATE_OLD_COMPACT = /(?<![A-ZÑ0-9])([A-Z]{1,2})(\d{4})([A-Z]{1,2})(?![A-ZÑ0-9])/g
// Códigos provinciales válidos del sistema antiguo de matriculación
const PROVINCE_CODES = new Set([
    'A', 'AB', 'AL', 'AV', 'B', 'BA', 'BI', 'BU', 'C', 'CA', 'CC', 'CE', 'CO',
    'CR', 'CS', 'CU', 'GC', 'GE', 'GI', 'GR', 'GU', 'H', 'HU', 'J', 'L', 'LE',
    'LO', 'LU', 'M', 'MA', 'ML', 'MU', 'NA', 'O', 'OR', 'OU', 'P', 'PM', 'PO',
    'S', 'SA', 'SE', 'SG', 'SO', 'SS', 'T', 'TE', 'TF', 'TO', 'V', 'VA', 'VI',
    'Z', 'ZA'
])
// Fechas dd/mm/aaaa (o dd-mm-aa)
const DATE_RE = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g
// Número de póliza: cadena de 6-15 dígitos (fuera de fechas)
const POLICY_NUM_RE = /\b(\d{6,15})\b/
// Número de póliza global del documento ("Póliza nº: 12345678",
// "Anexo a la Póliza número: 030-0047248350"). El token capturado debe
// empezar por dígito.
const GLOBAL_POLICY_RE = /P[ÓO]LIZA\s*(?:N(?:[UÚ]M(?:ERO)?)?\.?[ºO°]?\.?\s*)?[:\-]?\s*(\d[A-Z0-9\/-]{4,19})/i

// Escala de render para el OCR (equilibrio precisión/memoria)
const OCR_RENDER_SCALE = 2.5
// Límite de páginas a OCR (los listados de flota son de pocas páginas;
// evita colgar el navegador con documentos enormes)
const OCR_MAX_PAGES = 15

export interface PdfParseOutput {
    policies: ParsedPolicy[]
    errors: string[]
    aseguradora?: string
    pages: number
    /** true si las matrículas se obtuvieron por OCR (PDF sin texto utilizable) */
    usedOcr?: boolean
}

async function loadPdf(file: File): Promise<PDFDocumentProxy> {
    const pdfjs = await import('pdfjs-dist')
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        // El worker se copia a /public en postinstall/prebuild
        // (scripts/copy-pdf-worker.mjs) para servirlo como asset estático
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }
    const data = await file.arrayBuffer()
    return pdfjs.getDocument({ data }).promise
}

/**
 * Reconstruye las líneas de texto de todas las páginas de un PDF.
 * pdf.js devuelve fragmentos sueltos con coordenadas; se agrupan por
 * coordenada Y (con tolerancia) y se ordenan por X para recomponer cada línea.
 */
async function extractTextLines(pdf: PDFDocumentProxy): Promise<string[]> {
    const lines: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()

        const rows: Array<{ y: number; items: Array<{ x: number; str: string }> }> = []
        for (const item of content.items) {
            if (!('str' in item)) continue
            const str = (item as { str: string }).str
            if (!str || !str.trim()) continue
            const transform = (item as { transform: number[] }).transform
            const x = transform[4]
            const y = transform[5]

            let row = rows.find(r => Math.abs(r.y - y) <= 2.5)
            if (!row) {
                row = { y, items: [] }
                rows.push(row)
            }
            row.items.push({ x, str })
        }

        rows.sort((a, b) => b.y - a.y) // de arriba a abajo
        for (const row of rows) {
            row.items.sort((a, b) => a.x - b.x)
            const line = row.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
            if (line) lines.push(line)
        }
    }

    return lines
}

/**
 * OCR de respaldo: renderiza cada página a un canvas y reconoce el texto con
 * tesseract.js (idioma español). Solo se usa cuando la capa de texto del PDF
 * no contiene matrículas (escaneos o fuentes sin ToUnicode).
 */
async function ocrPdfLines(pdf: PDFDocumentProxy): Promise<string[]> {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('spa')
    const lines: string[] = []

    try {
        const numPages = Math.min(pdf.numPages, OCR_MAX_PAGES)
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const viewport = page.getViewport({ scale: OCR_RENDER_SCALE })
            const canvas = document.createElement('canvas')
            canvas.width = Math.ceil(viewport.width)
            canvas.height = Math.ceil(viewport.height)
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('No se pudo crear el canvas para el OCR')

            await page.render({ canvasContext: ctx, viewport, canvas }).promise
            const { data } = await worker.recognize(canvas)
            for (const rawLine of data.text.split('\n')) {
                const line = rawLine.replace(/\s+/g, ' ').trim()
                if (line) lines.push(line)
            }
            // Liberar memoria del canvas
            canvas.width = 0
            canvas.height = 0
        }
    } finally {
        await worker.terminate()
    }

    return lines
}

function toIsoDate(day: string, month: string, year: string): string | null {
    const y = year.length === 2 ? `20${year}` : year
    const m = parseInt(month, 10)
    const d = parseInt(day, 10)
    if (m < 1 || m > 12 || d < 1 || d > 31) return null
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function findDates(text: string): string[] {
    const dates: string[] = []
    for (const match of text.matchAll(DATE_RE)) {
        const iso = toIsoDate(match[1], match[2], match[3])
        if (iso) dates.push(iso)
    }
    return dates
}

export function findPlates(text: string): string[] {
    const plates: string[] = []
    for (const match of text.matchAll(PLATE_NEW)) {
        if (PLATE_LETTER_BLOCKLIST.has(match[2])) continue
        plates.push(`${match[1]}${match[2]}`)
    }
    for (const re of [PLATE_OLD_HYPHEN, PLATE_OLD_COMPACT]) {
        for (const match of text.matchAll(re)) {
            if (!PROVINCE_CODES.has(match[1])) continue
            plates.push(`${match[1]}${match[2]}${match[3]}`)
        }
    }
    return plates
}

/**
 * Variante tolerante para texto procedente de OCR: además de los regex
 * estrictos, recupera matrículas con los errores típicos del reconocimiento —
 * "O553LWL" (letra O en lugar de cero), "0444L.LGW" (punto intercalado y
 * letra duplicada).
 */
export function findPlatesLoose(text: string): string[] {
    const plates = new Set<string>(findPlates(text))

    for (const rawToken of text.split(/\s+/)) {
        const token = rawToken.replace(/[.,;:()]/g, '')
        const m = token.match(/^([0-9O]{4})-?([A-ZÑ]{3,4})$/)
        if (!m) continue
        const digits = m[1].replace(/O/g, '0')
        let letters = m[2]
        // El OCR a veces duplica la primera letra ("LGW" → "LLGW")
        if (letters.length === 4 && letters[0] === letters[1]) letters = letters.slice(1)
        if (!PLATE_LETTERS_RE.test(letters)) continue
        if (PLATE_LETTER_BLOCKLIST.has(letters)) continue
        plates.add(digits + letters)
    }

    return [...plates]
}

export function detectAseguradora(fullText: string): string | undefined {
    const upper = fullText.toUpperCase()
    for (const name of ASEGURADORAS_CONOCIDAS) {
        if (upper.includes(name)) {
            // Normalizar variantes con acentos
            if (name.startsWith('LINEA') || name.startsWith('LÍNEA')) return 'Línea Directa'
            if (name.startsWith('MUTUA')) return 'Mutua Madrileña'
            if (name.startsWith('SANTALUC')) return 'Santalucía'
            return name.charAt(0) + name.slice(1).toLowerCase()
        }
    }
    return undefined
}

interface ScanResult {
    policies: ParsedPolicy[]
    aseguradora?: string
}

/**
 * Marca del vehículo que acompaña a la matrícula en los listados de flota
 * ("0198LXP CITROEN 0218KRT FORD…"): texto tras las letras de la matrícula
 * hasta el siguiente bloque de 4 dígitos. Sirve para prefiltrar el buscador
 * al asignar manualmente pólizas sin coincidencia.
 */
export function extractBrandForPlate(upperLine: string, matricula: string): string | undefined {
    const digits = matricula.match(/\d{4}/)?.[0]
    if (!digits) return undefined
    const idx = upperLine.indexOf(digits)
    if (idx < 0) return undefined
    const after = upperLine.slice(idx + 4)
    const m = after.match(/^[\s.-]*[A-ZÑ.]{3,5}\s+([A-ZÑ][A-ZÑ\s.-]*?)(?=\s+[0-9O]{4}|$)/)
    const brand = m?.[1]?.trim()
    if (!brand || brand.length > 25) return undefined
    return brand
}

/**
 * Recorre las líneas del documento y construye una póliza por matrícula
 * detectada (número de póliza, fechas y tipo si acompañan en la misma línea).
 * Exportada para poder testearla con líneas reales de PDFs de aseguradoras.
 */
export function scanPolicies(lines: string[], plateFinder: (text: string) => string[]): ScanResult {
    const fullText = lines.join('\n')
    const aseguradora = detectAseguradora(fullText)
    const globalPolicyMatch = fullText.toUpperCase().match(GLOBAL_POLICY_RE)
    const globalPolicyNum = globalPolicyMatch ? globalPolicyMatch[1] : null

    const seen = new Set<string>()
    const policies: ParsedPolicy[] = []

    for (const line of lines) {
        const upperLine = line.toUpperCase()
        const plates = plateFinder(upperLine)
        if (plates.length === 0) continue

        // Fechas y número de póliza de la misma línea (si el PDF es un
        // listado de flota con una fila por vehículo)
        const dates = findDates(upperLine)
        const lineWithoutDates = upperLine.replace(DATE_RE, ' ')
        let lineNumeroPoliza: string | null = null
        const polizaMatch = lineWithoutDates.replace(PLATE_NEW, ' ').match(POLICY_NUM_RE)
        if (polizaMatch) lineNumeroPoliza = polizaMatch[1]

        for (const plate of plates) {
            const matricula = normalizeMatricula(plate)
            if (!matricula || seen.has(matricula)) continue
            seen.add(matricula)

            const numeroPoliza =
                lineNumeroPoliza ||
                (globalPolicyNum ? `${globalPolicyNum}-${matricula}` : `PDF-${matricula}`)

            policies.push({
                numeroPoliza,
                // Sin número propio en la línea: es un placeholder derivado y
                // no debe machacar el número real de una póliza ya registrada
                numeroPolizaGenerado: !lineNumeroPoliza,
                matricula,
                marcaModelo: extractBrandForPlate(upperLine, matricula),
                fechaAlta: dates[0] || null,
                fechaVencimiento: dates[1] || null,
                tipoPoliza: upperLine.includes('TERCEROS') ? 'Terceros' : 'Todo Riesgo',
                prima: undefined,
                aseguradora
            })
        }
    }

    return { policies, aseguradora }
}

/**
 * Parsea el PDF de la aseguradora y devuelve una póliza por matrícula
 * detectada. Los campos que el PDF no aporte (fechas, prima…) quedan a null
 * y reciben valores por defecto al confirmar la importación.
 */
export async function parseInsurancePdf(file: File): Promise<PdfParseOutput> {
    const errors: string[] = []
    const pdf = await loadPdf(file)
    const pages = pdf.numPages

    // Fase 1: capa de texto del PDF
    let result: ScanResult = { policies: [] }
    try {
        const textLines = await extractTextLines(pdf)
        result = scanPolicies(textLines, findPlates)
    } catch (err) {
        console.warn('Fallo extrayendo la capa de texto del PDF:', err)
    }
    let usedOcr = false

    // Fase 2: OCR de respaldo cuando el texto no contiene matrículas
    // (PDF escaneado o con fuentes sin ToUnicode, como los listados AXA)
    if (result.policies.length === 0) {
        try {
            const ocrLines = await ocrPdfLines(pdf)
            const ocrResult = scanPolicies(ocrLines, findPlatesLoose)
            if (ocrResult.policies.length > 0) {
                result = ocrResult
                usedOcr = true
            }
        } catch (err) {
            console.error('Fallo en el OCR del PDF:', err)
            errors.push(
                `El OCR del documento falló: ${err instanceof Error ? err.message : 'error desconocido'}. ` +
                'Comprueba la conexión a internet (el reconocimiento descarga sus datos la primera vez) y vuelve a intentarlo.'
            )
        }
    }

    if (result.policies.length === 0 && errors.length === 0) {
        errors.push(
            `Se leyeron ${pages} página(s) del PDF (texto y OCR) pero no se encontró ninguna matrícula española. ` +
            'Comprueba que el documento incluye las matrículas de los vehículos asegurados.'
        )
    }

    if (usedOcr) {
        errors.push('El PDF no contenía texto legible: las matrículas se han reconocido por OCR. Revisa la lista antes de confirmar.')
    }

    return { policies: result.policies, errors, aseguradora: result.aseguradora, pages, usedOcr }
}
