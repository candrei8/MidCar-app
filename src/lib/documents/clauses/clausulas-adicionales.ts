/**
 * Cláusulas que el comercial escribe a mano al generar el documento.
 *
 * En el formulario se teclean como texto libre: cada bloque separado por una
 * línea en blanco (o, si no hay ninguna, cada línea) es una cláusula distinta,
 * y se numeran continuando la serie de las cláusulas fijas del contrato.
 */

const ORDINALES = [
    'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA', 'SÉPTIMA',
    'OCTAVA', 'NOVENA', 'DÉCIMA', 'UNDÉCIMA', 'DUODÉCIMA', 'DECIMOTERCERA',
    'DECIMOCUARTA', 'DECIMOQUINTA', 'DECIMOSEXTA', 'DECIMOSÉPTIMA',
    'DECIMOCTAVA', 'DECIMONOVENA', 'VIGÉSIMA', 'VIGÉSIMA PRIMERA',
    'VIGÉSIMA SEGUNDA', 'VIGÉSIMA TERCERA', 'VIGÉSIMA CUARTA', 'VIGÉSIMA QUINTA'
]

/** Ordinal femenino en mayúsculas; a partir del último cae en "CLÁUSULA N" */
export function ordinalClausula(indice: number): string {
    return ORDINALES[indice] || `CLÁUSULA ${indice + 1}`
}

/** Separa el texto libre del formulario en cláusulas individuales */
export function parseClausulasAdicionales(texto: string | undefined | null): string[] {
    const limpio = (texto || '').trim()
    if (!limpio) return []

    // Preferimos separar por línea en blanco: permite cláusulas de varias líneas
    const porBloques = limpio.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    if (porBloques.length > 1) return porBloques

    return limpio.split(/\n/).map(l => l.trim()).filter(Boolean)
}
