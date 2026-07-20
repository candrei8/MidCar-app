/**
 * insurancePdfParser.ts
 *
 * Extracción de pólizas desde el PDF que envía la aseguradora (AXA, etc.).
 * Se procesa íntegramente en el navegador con pdf.js: se reconstruyen las
 * líneas de texto del PDF y se detectan las matrículas españolas (formato
 * nuevo 0000XXX y antiguo M-0000-XX), junto con número de póliza, fechas y
 * compañía cuando aparecen.
 *
 * El resultado usa el mismo formato ParsedPolicy que la importación
 * Excel/CSV, de modo que reutiliza el matching con vehículos y el modal de
 * previsualización existentes.
 */

import { ParsedPolicy } from '@/components/insurance/ImportPreviewModal'
import { normalizeMatricula } from './insuranceFileParser'

// Compañías conocidas para detectar la aseguradora en el texto del PDF
const ASEGURADORAS_CONOCIDAS = [
    'AXA', 'MAPFRE', 'ALLIANZ', 'GENERALI', 'ZURICH', 'REALE', 'PELAYO',
    'LINEA DIRECTA', 'LÍNEA DIRECTA', 'MUTUA MADRILEÑA', 'MUTUA MADRILENA',
    'CATALANA OCCIDENTE', 'OCASO', 'SANTALUCIA', 'SANTALUCÍA', 'HELVETIA',
    'LIBERTY', 'QUALITAS', 'BALUMBA', 'VERTI', 'GENESIS', 'FIATC', 'PLUS ULTRA'
]

// Matrícula española formato nuevo: 4 dígitos + 3 consonantes (sin vocales ni Ñ/Q)
const PLATE_NEW = /(?<![A-ZÑ0-9])(\d{4})[\s.-]?([BCDFGHJKLMNPRSTVWXYZ]{3})(?![A-ZÑ0-9])/g
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
// "PÓLIZA NUMERO 076543210"). El token capturado debe empezar por dígito.
const GLOBAL_POLICY_RE = /P[ÓO]LIZA\s*(?:N(?:UM(?:ERO)?)?\.?[ºO°]?\.?\s*)?[:\-]?\s*(\d[A-Z0-9\/-]{4,19})/i

export interface PdfParseOutput {
    policies: ParsedPolicy[]
    errors: string[]
    aseguradora?: string
    pages: number
}

/**
 * Reconstruye las líneas de texto de todas las páginas de un PDF.
 * pdf.js devuelve fragmentos sueltos con coordenadas; se agrupan por
 * coordenada Y (con tolerancia) y se ordenan por X para recomponer cada línea.
 */
async function extractPdfLines(file: File): Promise<{ lines: string[]; pages: number }> {
    const pdfjs = await import('pdfjs-dist')
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        // El worker se copia a /public en postinstall/prebuild
        // (scripts/copy-pdf-worker.mjs) para servirlo como asset estático
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }

    const data = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data }).promise
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

    return { lines, pages: pdf.numPages }
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

/**
 * Parsea el PDF de la aseguradora y devuelve una póliza por matrícula
 * detectada. Los campos que el PDF no aporte (fechas, prima…) quedan a null
 * y reciben valores por defecto al confirmar la importación.
 */
export async function parseInsurancePdf(file: File): Promise<PdfParseOutput> {
    const errors: string[] = []

    const { lines, pages } = await extractPdfLines(file)
    if (lines.length === 0) {
        return {
            policies: [],
            errors: [
                'No se pudo extraer texto del PDF. Si es un documento escaneado (imagen), no contiene texto seleccionable: usa un PDF original de la aseguradora o un Excel/CSV.'
            ],
            pages
        }
    }

    const fullText = lines.join('\n')
    const aseguradora = detectAseguradora(fullText)
    const globalPolicyMatch = fullText.match(GLOBAL_POLICY_RE)
    const globalPolicyNum = globalPolicyMatch ? globalPolicyMatch[1] : null

    const seen = new Set<string>()
    const policies: ParsedPolicy[] = []

    for (const line of lines) {
        const upperLine = line.toUpperCase()
        const plates = findPlates(upperLine)
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
                marcaModelo: undefined,
                fechaAlta: dates[0] || null,
                fechaVencimiento: dates[1] || null,
                tipoPoliza: upperLine.includes('TERCEROS') ? 'Terceros' : 'Todo Riesgo',
                prima: undefined,
                aseguradora
            })
        }
    }

    if (policies.length === 0) {
        errors.push(
            `Se leyeron ${pages} página(s) del PDF pero no se encontró ninguna matrícula española. ` +
            'Comprueba que el documento incluye las matrículas de los vehículos asegurados.'
        )
    }

    return { policies, errors, aseguradora, pages }
}
