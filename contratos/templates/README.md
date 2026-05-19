# Plantillas oficiales de documentos MidCar

Esta carpeta contiene la **fuente de verdad textual** de los cuatro documentos
que MidCar genera para cada vehículo. Cada archivo `.md` reproduce —con sus
placeholders— el contenido literal que la aplicación imprime en PDF a través de
`src/lib/documents/templates/*-template.ts`.

| Documento | Plantilla Markdown | Plantilla TypeScript | Cláusulas |
|-----------|--------------------|----------------------|-----------|
| Contrato de compraventa y garantía V.O. | [compraventa.md](./compraventa.md) | `compraventa-template.ts` | `compraventa-clauses.ts` |
| Contrato de señal de compraventa | [senal.md](./senal.md) | `senal-template.ts` | `senal-clauses.ts` |
| Factura | [factura.md](./factura.md) | `factura-template.ts` | — |
| Factura Proforma | [proforma.md](./proforma.md) | `proforma-template.ts` | — |

## Identificador único MidCar (QR + ID legible)

Todos los documentos generados por la plataforma incluyen en su pie de página:

1. La etiqueta **«DOCUMENTO VERIFICABLE MIDCAR»**.
2. El **identificador único** con formato `MID-{TIPO}-{AÑO}-{SECUENCIA}-{HASH8}`
   donde:
   - `TIPO` = `CV` (compraventa), `SN` (señal), `FA` (factura) o `PF` (proforma).
   - `AÑO` = año natural del documento.
   - `SECUENCIA` = número correlativo extraído del `numero_<tipo>`.
   - `HASH8` = huella alfanumérica derivada de tipo + VIN + DNI + número + año.
3. La URL pública de verificación: `https://midcar.es/v/{IDENTIFICADOR}`.
4. Un **código QR** que apunta a esa misma URL.

Esta combinación garantiza que cualquier copia impresa pueda validarse de forma
inmediata y confirme que ha sido emitida por MidCar.

## Placeholders comunes

Los marcadores entre llaves dobles `{{...}}` se sustituyen en tiempo de
ejecución por los datos del CRM (vehículo, cliente, empresa vendedora y
condiciones económicas):

- `{{VENDEDOR}}`, `{{COMPRADOR}}` — nombre + apellidos / razón social.
- `{{VENDEDOR.DNI}}`, `{{COMPRADOR.DNI}}` — DNI / NIE / CIF.
- `{{VENDEDOR.DIRECCION}}`, `{{COMPRADOR.DIRECCION}}` — dirección completa.
- `{{VEHICULO.MATRICULA}}`, `{{VEHICULO.BASTIDOR}}`, `{{VEHICULO.MARCA_MODELO}}`,
  `{{VEHICULO.KM}}`, `{{VEHICULO.COLOR}}`, `{{VEHICULO.FECHA_MATRICULACION}}`.
- `{{PRECIO}}`, `{{PRECIO_LETRAS}}`, `{{BASE_IMPONIBLE}}`, `{{IVA_PERCENT}}`,
  `{{IVA_IMPORTE}}`, `{{TOTAL}}`.
- `{{IMPORTE_SENAL}}`, `{{IMPORTE_RESERVA}}`.
- `{{CUENTA_BANCARIA}}` — IBAN de la empresa vendedora.
- `{{FECHA}}`, `{{LUGAR}}`, `{{HORA}}`.
- `{{MESES_GARANTIA}}` — duración de la garantía legal (12 meses por defecto).
- `{{IDENTIFICADOR_MIDCAR}}` — ID único generado en el momento de emisión.
- `{{URL_VERIFICACION}}` — `https://midcar.es/v/{IDENTIFICADOR_MIDCAR}`.
- `{{QR_CODE}}` — código QR PNG embebido en base64.
