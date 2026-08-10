import { parseNotes, appendNote, removeNote } from '../contact-notes'

describe('contact-notes', () => {
    it('devuelve lista vacía si no hay notas', () => {
        expect(parseNotes(null)).toEqual([])
        expect(parseNotes('   ')).toEqual([])
    })

    it('conserva como nota sin fecha el texto antiguo sin cabecera', () => {
        const notes = parseNotes('Cliente de confianza')
        expect(notes).toHaveLength(1)
        expect(notes[0].texto).toBe('Cliente de confianza')
        expect(notes[0].fecha).toBeUndefined()
    })

    it('añade una nota con fecha, hora y autor', () => {
        const raw = appendNote('', 'Pide financiación', 'Andrei', new Date('2026-08-10T12:30:00'))
        const notes = parseNotes(raw)
        expect(notes).toHaveLength(1)
        expect(notes[0]).toMatchObject({
            fecha: '10/08/2026',
            hora: '12:30',
            autor: 'Andrei',
            texto: 'Pide financiación',
        })
    })

    it('pone la nota nueva la primera y mantiene las anteriores', () => {
        let raw = appendNote('', 'Primera', 'Ana', new Date('2026-08-09T09:15:00'))
        raw = appendNote(raw, 'Segunda', 'Luis', new Date('2026-08-10T12:30:00'))
        const notes = parseNotes(raw)
        expect(notes.map(n => n.texto)).toEqual(['Segunda', 'Primera'])
    })

    it('respeta las notas de varias líneas', () => {
        const raw = appendNote('', 'Línea 1\nLínea 2', 'Ana', new Date('2026-08-10T12:30:00'))
        expect(parseNotes(raw)[0].texto).toBe('Línea 1\nLínea 2')
    })

    it('ignora texto vacío', () => {
        expect(appendNote('algo', '   ')).toBe('algo')
    })

    it('elimina la nota indicada', () => {
        let raw = appendNote('', 'Primera', 'Ana', new Date('2026-08-09T09:15:00'))
        raw = appendNote(raw, 'Segunda', 'Luis', new Date('2026-08-10T12:30:00'))
        const id = parseNotes(raw)[0].id
        const notes = parseNotes(removeNote(raw, id))
        expect(notes.map(n => n.texto)).toEqual(['Primera'])
    })

    it('mezcla notas antiguas sin cabecera con notas nuevas', () => {
        const raw = appendNote('Nota antigua', 'Nota nueva', 'Ana', new Date('2026-08-10T12:30:00'))
        const notes = parseNotes(raw)
        expect(notes).toHaveLength(2)
        expect(notes[0].fecha).toBe('10/08/2026')
        expect(notes[1].texto).toBe('Nota antigua')
    })
})
