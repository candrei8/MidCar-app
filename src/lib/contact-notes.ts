/**
 * Las notas de un contacto se guardan en la columna de texto `contacts.notas`.
 * Para poder tener varias notas fechadas dentro de un único campo, cada una se
 * escribe con una cabecera legible y se separan con una línea `---`:
 *
 *   [10/08/2026 12:30 · Andrei] Llamado, pide financiación
 *   ---
 *   [09/08/2026 09:15] Interesado en el A3
 *
 * El texto que no lleva cabecera (notas antiguas escritas desde "Editar
 * contacto") se conserva tal cual como una nota sin fecha.
 */

export interface ContactNote {
    /** Identificador estable dentro del texto: la posición del bloque */
    id: string
    fecha?: string
    hora?: string
    autor?: string
    texto: string
}

const SEPARATOR = '\n---\n'
const HEADER_RE = /^\[(\d{2}\/\d{2}\/\d{4})(?:\s+(\d{2}:\d{2}))?(?:\s*·\s*([^\]]+))?\]\s*/

export function parseNotes(raw?: string | null): ContactNote[] {
    if (!raw || !raw.trim()) return []

    return raw
        .split(/\n-{3,}\n/)
        .map(chunk => chunk.trim())
        .filter(Boolean)
        .map((chunk, index) => {
            const match = chunk.match(HEADER_RE)
            if (!match) {
                return { id: String(index), texto: chunk }
            }
            return {
                id: String(index),
                fecha: match[1],
                hora: match[2],
                autor: match[3]?.trim(),
                texto: chunk.slice(match[0].length).trim(),
            }
        })
        .filter(note => note.texto.length > 0)
}

export function serializeNotes(notes: ContactNote[]): string {
    return notes
        .map(note => {
            if (!note.fecha) return note.texto
            const cabecera = [
                note.fecha,
                note.hora,
                note.autor ? `· ${note.autor}` : null,
            ]
                .filter(Boolean)
                .join(' ')
            return `[${cabecera}] ${note.texto}`
        })
        .join(SEPARATOR)
}

/** Añade una nota nueva al principio y devuelve el texto listo para guardar */
export function appendNote(raw: string | null | undefined, texto: string, autor?: string, now: Date = new Date()): string {
    const limpio = texto.trim()
    if (!limpio) return raw || ''

    const nueva: ContactNote = {
        id: 'nueva',
        fecha: now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        autor: autor?.trim() || undefined,
        texto: limpio,
    }

    return serializeNotes([nueva, ...parseNotes(raw)])
}

/** Elimina la nota indicada y devuelve el texto listo para guardar */
export function removeNote(raw: string | null | undefined, id: string): string {
    return serializeNotes(parseNotes(raw).filter(note => note.id !== id))
}
