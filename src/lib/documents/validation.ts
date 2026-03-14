/**
 * Validación de documentos de identidad españoles
 * DNI, NIE y CIF
 */

// Letras de control para DNI
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Letras válidas para NIE (primer carácter)
const NIE_FIRST_LETTERS = 'XYZ';

// Letras válidas para CIF (primer carácter)
const CIF_LETTERS = 'ABCDEFGHJKLMNPQRSUVW';

/**
 * Valida un DNI español
 * @param dni - DNI a validar (formato: 12345678A)
 * @returns true si el DNI es válido
 */
export function validateDNI(dni: string): boolean {
  if (!dni) return false;

  // Limpiar y normalizar
  const cleanDNI = dni.toUpperCase().replace(/[^0-9A-Z]/g, '');

  // Formato: 8 dígitos + 1 letra
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (!dniRegex.test(cleanDNI)) return false;

  // Extraer número y letra
  const number = parseInt(cleanDNI.slice(0, 8), 10);
  const letter = cleanDNI.slice(8);

  // Calcular letra de control
  const expectedLetter = DNI_LETTERS[number % 23];

  return letter === expectedLetter;
}

/**
 * Valida un NIE español
 * @param nie - NIE a validar (formato: X1234567A)
 * @returns true si el NIE es válido
 */
export function validateNIE(nie: string): boolean {
  if (!nie) return false;

  // Limpiar y normalizar
  const cleanNIE = nie.toUpperCase().replace(/[^0-9A-Z]/g, '');

  // Formato: X/Y/Z + 7 dígitos + 1 letra
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (!nieRegex.test(cleanNIE)) return false;

  // Reemplazar primera letra por número (X=0, Y=1, Z=2)
  const firstLetter = cleanNIE[0];
  const replacement = NIE_FIRST_LETTERS.indexOf(firstLetter).toString();
  const dniNumber = replacement + cleanNIE.slice(1, 8);

  // Validar como DNI
  const number = parseInt(dniNumber, 10);
  const letter = cleanNIE.slice(8);
  const expectedLetter = DNI_LETTERS[number % 23];

  return letter === expectedLetter;
}

/**
 * Valida un CIF español
 * @param cif - CIF a validar (formato: A12345678)
 * @returns true si el CIF es válido
 */
export function validateCIF(cif: string): boolean {
  if (!cif) return false;

  // Limpiar y normalizar
  const cleanCIF = cif.toUpperCase().replace(/[^0-9A-Z]/g, '');

  // Formato: 1 letra + 7 dígitos + 1 dígito/letra de control
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
  if (!cifRegex.test(cleanCIF)) return false;

  // Extraer partes
  const letra = cleanCIF[0];
  const digitos = cleanCIF.slice(1, 8);
  const control = cleanCIF[8];

  // Calcular dígito de control
  let sumaPares = 0;
  let sumaImpares = 0;

  for (let i = 0; i < digitos.length; i++) {
    const digito = parseInt(digitos[i], 10);

    if (i % 2 === 0) {
      // Posición impar (1, 3, 5, 7) - multiplicar por 2
      const doble = digito * 2;
      sumaImpares += doble > 9 ? doble - 9 : doble;
    } else {
      // Posición par (2, 4, 6)
      sumaPares += digito;
    }
  }

  const sumaTotal = sumaPares + sumaImpares;
  const digitoControl = (10 - (sumaTotal % 10)) % 10;

  // Determinar si el control debe ser número o letra
  const letrasControl = 'JABCDEFGHI';
  const letraControl = letrasControl[digitoControl];

  // Sociedades que terminan en letra: K, P, Q, S (y algunas más)
  const sociedadesConLetra = 'KPQS';
  const sociedadesConNumero = 'ABEH';

  if (sociedadesConLetra.includes(letra)) {
    return control === letraControl;
  } else if (sociedadesConNumero.includes(letra)) {
    return control === digitoControl.toString();
  } else {
    // El resto puede ser número o letra
    return control === digitoControl.toString() || control === letraControl;
  }
}

/**
 * Valida cualquier documento de identidad español (DNI, NIE o CIF)
 * @param documento - Documento a validar
 * @returns objeto con tipo de documento y validez
 */
export function validateDocumento(documento: string): {
  isValid: boolean;
  type: 'DNI' | 'NIE' | 'CIF' | 'unknown';
  formatted: string;
} {
  if (!documento) {
    return { isValid: false, type: 'unknown', formatted: '' };
  }

  const clean = documento.toUpperCase().replace(/[^0-9A-Z]/g, '');

  // Intentar identificar el tipo
  if (/^[0-9]{8}[A-Z]$/.test(clean)) {
    // Parece DNI
    return {
      isValid: validateDNI(clean),
      type: 'DNI',
      formatted: clean.slice(0, 8) + clean.slice(8)
    };
  }

  if (/^[XYZ][0-9]{7}[A-Z]$/.test(clean)) {
    // Parece NIE
    return {
      isValid: validateNIE(clean),
      type: 'NIE',
      formatted: clean
    };
  }

  if (/^[A-Z][0-9]{7}[0-9A-Z]$/.test(clean) && CIF_LETTERS.includes(clean[0])) {
    // Parece CIF
    return {
      isValid: validateCIF(clean),
      type: 'CIF',
      formatted: clean
    };
  }

  return { isValid: false, type: 'unknown', formatted: clean };
}

/**
 * Formatea un documento de identidad
 * @param documento - Documento a formatear
 * @returns documento formateado o el original si no se puede formatear
 */
export function formatDocumento(documento: string): string {
  if (!documento) return '';

  const result = validateDocumento(documento);
  return result.formatted || documento.toUpperCase();
}
