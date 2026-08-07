import {
    cn,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatDate,
    formatShortDate,
    truncate,
    slugify,
    generateId,
    isModifiedAfterCreation,
} from '@/lib/utils'

describe('Utilidades - cn (classnames)', () => {
    it('combina clases simples', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('maneja clases condicionales', () => {
        expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('fusiona clases de Tailwind correctamente', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
    })
})

describe('Utilidades - formatCurrency', () => {
    it('formatea números como moneda EUR', () => {
        const result = formatCurrency(1500)
        // Verifica que contiene el número y el símbolo de euro
        expect(result).toMatch(/1[.,]?500/)
        expect(result).toContain('€')
    })

    it('maneja cero correctamente', () => {
        const result = formatCurrency(0)
        expect(result).toContain('0')
    })

    it('maneja números grandes', () => {
        const result = formatCurrency(150000)
        expect(result).toMatch(/150[.,]?000/)
    })
})

describe('Utilidades - formatNumber', () => {
    it('formatea números correctamente', () => {
        const result = formatNumber(1500)
        // El resultado debe contener 1500 (con o sin separador de miles)
        expect(result).toMatch(/1[.,]?500/)
    })

    it('formatea números grandes', () => {
        const result = formatNumber(1500000)
        expect(result).toMatch(/1[.,]?500[.,]?000/)
    })
})

describe('Utilidades - formatPercentage', () => {
    it('añade signo + a números positivos', () => {
        expect(formatPercentage(5.5)).toBe('+5.5%')
    })

    it('mantiene signo - en números negativos', () => {
        expect(formatPercentage(-3.2)).toBe('-3.2%')
    })

    it('maneja cero', () => {
        expect(formatPercentage(0)).toBe('+0.0%')
    })
})

describe('Utilidades - formatDate', () => {
    it('formatea fecha desde string ISO', () => {
        const result = formatDate('2024-03-15')
        expect(result).toContain('15')
        expect(result).toContain('marzo')
        expect(result).toContain('2024')
    })

    it('formatea fecha desde objeto Date', () => {
        const date = new Date(2024, 2, 15) // Marzo 15, 2024
        const result = formatDate(date)
        expect(result).toContain('15')
        expect(result).toContain('marzo')
    })
})

describe('Utilidades - formatShortDate', () => {
    it('formatea fecha en formato corto', () => {
        const result = formatShortDate('2024-03-15')
        expect(result).toMatch(/15\/03\/2024|15-03-2024/)
    })
})

describe('Utilidades - truncate', () => {
    it('trunca strings largos', () => {
        expect(truncate('Este es un texto muy largo', 15)).toBe('Este es un t...')
    })

    it('no modifica strings cortos', () => {
        expect(truncate('Corto', 15)).toBe('Corto')
    })

    it('maneja string igual al límite', () => {
        expect(truncate('12345', 5)).toBe('12345')
    })
})

describe('Utilidades - slugify', () => {
    it('convierte a minúsculas y reemplaza espacios', () => {
        expect(slugify('Hola Mundo')).toBe('hola-mundo')
    })

    it('reemplaza caracteres especiales españoles', () => {
        expect(slugify('Año Nuevo Español')).toBe('ano-nuevo-espanol')
    })

    it('elimina caracteres especiales', () => {
        expect(slugify('Test! @#$ Value')).toBe('test-value')
    })
})

describe('Utilidades - generateId', () => {
    it('genera IDs únicos', () => {
        const id1 = generateId()
        const id2 = generateId()
        expect(id1).not.toBe(id2)
    })

    it('genera IDs con longitud esperada', () => {
        const id = generateId()
        expect(id.length).toBeGreaterThan(5)
    })
})

describe('Utilidades - isModifiedAfterCreation', () => {
    it('devuelve false si las fechas son idénticas', () => {
        const t = '2026-08-01T10:00:00.000Z'
        expect(isModifiedAfterCreation(t, t)).toBe(false)
    })

    it('devuelve false si la diferencia es de milisegundos (alta del registro)', () => {
        expect(isModifiedAfterCreation('2026-08-01T10:00:00.000Z', '2026-08-01T10:00:00.850Z')).toBe(false)
    })

    it('devuelve false si la diferencia es menor de un minuto', () => {
        expect(isModifiedAfterCreation('2026-08-01T10:00:00.000Z', '2026-08-01T10:00:59.000Z')).toBe(false)
    })

    it('devuelve true si la modificación es posterior en más de un minuto', () => {
        expect(isModifiedAfterCreation('2026-08-01T10:00:00.000Z', '2026-08-01T10:05:00.000Z')).toBe(true)
    })

    it('devuelve true para modificaciones de días después', () => {
        expect(isModifiedAfterCreation('2026-07-01T10:00:00.000Z', '2026-08-01T10:00:00.000Z')).toBe(true)
    })

    it('devuelve false si falta alguna fecha', () => {
        expect(isModifiedAfterCreation(undefined, '2026-08-01T10:00:00.000Z')).toBe(false)
        expect(isModifiedAfterCreation('2026-08-01T10:00:00.000Z', undefined)).toBe(false)
        expect(isModifiedAfterCreation(undefined, undefined)).toBe(false)
    })
})
