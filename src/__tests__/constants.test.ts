import {
    validarDNI,
    validarNIE,
    validarMatricula,
    DNI_REGEX,
    NIE_REGEX,
    CIF_REGEX,
    CP_REGEX,
    EMAIL_REGEX,
    TELEFONO_REGEX,
    MARCAS,
    COMBUSTIBLES,
    ESTADOS_VEHICULO,
    ESTADOS_LEAD,
} from '@/lib/constants'

describe('Validaciones - DNI', () => {
    it('valida DNI correcto con letra válida', () => {
        // DNI válido: 12345678Z
        expect(validarDNI('12345678Z')).toBe(true)
    })

    it('rechaza DNI con letra incorrecta', () => {
        expect(validarDNI('12345678A')).toBe(false)
    })

    it('rechaza DNI con formato incorrecto', () => {
        expect(validarDNI('1234567Z')).toBe(false) // 7 dígitos
        expect(validarDNI('123456789Z')).toBe(false) // 9 dígitos
        expect(validarDNI('ABCDEFGHZ')).toBe(false) // letras en lugar de números
    })

    it('valida DNI conocido: 00000000T', () => {
        expect(validarDNI('00000000T')).toBe(true)
    })
})

describe('Validaciones - NIE', () => {
    it('valida NIE correcto formato X', () => {
        // X0000000T es válido
        expect(validarNIE('X0000000T')).toBe(true)
    })

    it('rechaza NIE con formato incorrecto', () => {
        expect(validarNIE('A1234567Z')).toBe(false) // No empieza por X/Y/Z
    })

    it('acepta NIE que empieza por Y', () => {
        expect(NIE_REGEX.test('Y1234567A')).toBe(true)
    })

    it('acepta NIE que empieza por Z', () => {
        expect(NIE_REGEX.test('Z1234567A')).toBe(true)
    })
})

describe('Validaciones - CIF', () => {
    it('valida formato CIF correcto', () => {
        expect(CIF_REGEX.test('B12345678')).toBe(true)
        expect(CIF_REGEX.test('A12345670')).toBe(true)
    })

    it('rechaza CIF con letra inicial incorrecta', () => {
        expect(CIF_REGEX.test('X12345678')).toBe(false) // X no es válida para CIF
        expect(CIF_REGEX.test('112345678')).toBe(false) // No puede empezar por número
    })
})

describe('Validaciones - Código Postal', () => {
    it('acepta códigos postales válidos', () => {
        expect(CP_REGEX.test('28001')).toBe(true)
        expect(CP_REGEX.test('08001')).toBe(true)
        expect(CP_REGEX.test('50001')).toBe(true)
    })

    it('rechaza códigos postales inválidos', () => {
        expect(CP_REGEX.test('2800')).toBe(false) // 4 dígitos
        expect(CP_REGEX.test('280001')).toBe(false) // 6 dígitos
        expect(CP_REGEX.test('ABCDE')).toBe(false) // letras
    })
})

describe('Validaciones - Matrícula', () => {
    it('valida matrículas nuevas (0000XXX)', () => {
        expect(validarMatricula('1234BCD')).toBe(true)
        expect(validarMatricula('0000BBB')).toBe(true)
        expect(validarMatricula('9999ZZZ')).toBe(true)
    })

    it('valida matrículas con guiones o espacios', () => {
        expect(validarMatricula('1234-BCD')).toBe(true)
        expect(validarMatricula('1234 BCD')).toBe(true)
    })

    it('rechaza matrículas con vocales', () => {
        expect(validarMatricula('1234ABC')).toBe(false) // A es vocal
        expect(validarMatricula('1234BEF')).toBe(false) // E es vocal
    })

    it('valida matrículas antiguas', () => {
        expect(validarMatricula('M1234AB')).toBe(true)
        expect(validarMatricula('MA1234AB')).toBe(true)
    })
})

describe('Validaciones - Email', () => {
    it('acepta emails válidos', () => {
        expect(EMAIL_REGEX.test('test@example.com')).toBe(true)
        expect(EMAIL_REGEX.test('user.name@domain.es')).toBe(true)
        expect(EMAIL_REGEX.test('user+tag@example.org')).toBe(true)
    })

    it('rechaza emails inválidos', () => {
        expect(EMAIL_REGEX.test('invalid')).toBe(false)
        expect(EMAIL_REGEX.test('invalid@')).toBe(false)
        expect(EMAIL_REGEX.test('@domain.com')).toBe(false)
        expect(EMAIL_REGEX.test('no spaces@domain.com')).toBe(false)
    })
})

describe('Validaciones - Teléfono', () => {
    it('acepta móviles españoles', () => {
        expect(TELEFONO_REGEX.test('612345678')).toBe(true)
        expect(TELEFONO_REGEX.test('712345678')).toBe(true)
    })

    it('acepta teléfonos con prefijo +34', () => {
        expect(TELEFONO_REGEX.test('+34612345678')).toBe(true)
    })

    it('acepta fijos españoles', () => {
        expect(TELEFONO_REGEX.test('912345678')).toBe(true)
        expect(TELEFONO_REGEX.test('812345678')).toBe(true)
    })

    it('rechaza números inválidos', () => {
        expect(TELEFONO_REGEX.test('12345678')).toBe(false) // 8 dígitos sin prefijo
        expect(TELEFONO_REGEX.test('512345678')).toBe(false) // No empieza por 6/7/8/9
    })
})

describe('Constantes - Datos básicos', () => {
    it('MARCAS contiene las principales marcas', () => {
        expect(MARCAS).toContain('Audi')
        expect(MARCAS).toContain('BMW')
        expect(MARCAS).toContain('Seat')
        expect(MARCAS).toContain('Volkswagen')
        expect(MARCAS.length).toBeGreaterThan(10)
    })

    it('COMBUSTIBLES tiene todos los tipos', () => {
        const valores = COMBUSTIBLES.map(c => c.value)
        expect(valores).toContain('gasolina')
        expect(valores).toContain('diesel')
        expect(valores).toContain('electrico')
        expect(valores).toContain('hibrido')
    })

    it('ESTADOS_VEHICULO tiene los estados principales', () => {
        const valores = ESTADOS_VEHICULO.map(e => e.value)
        expect(valores).toContain('disponible')
        expect(valores).toContain('reservado')
        expect(valores).toContain('vendido')
    })

    it('ESTADOS_LEAD tiene el pipeline completo', () => {
        const valores = ESTADOS_LEAD.map(e => e.value)
        expect(valores).toContain('nuevo')
        expect(valores).toContain('contactado')
        expect(valores).toContain('vendido')
        expect(valores).toContain('perdido')
    })
})
