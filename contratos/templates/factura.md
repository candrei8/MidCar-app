# FACTURA

> Plantilla fiel al modelo oficial usado por MidCar. Renderizado por
> `src/lib/documents/templates/factura-template.ts`.

---

## Encabezado

| **N.º de factura:** {{NUMERO_FACTURA}} |     | **Fecha de la factura:** {{FECHA}} |
| -------------------------------------- | --- | ---------------------------------- |

## Datos de facturación

> Bloque izquierdo y bloque derecho mostrados en columnas, separados por la
> barra vertical azul corporativa MidCar.

| _Cliente:_                                       | _Facturar a:_                                    |
| ------------------------------------------------ | ------------------------------------------------ |
| **{{COMPRADOR}}**                                | **{{COMPRADOR_MAYUS}}**                          |
| {{COMPRADOR.DIRECCION}}                          | {{COMPRADOR.DIRECCION}}                          |
| {{COMPRADOR.CP}} - {{COMPRADOR.LOCALIDAD}}       | {{COMPRADOR.CP}} - {{COMPRADOR.LOCALIDAD}}       |
| **{{COMPRADOR.DNI}}**                            | **{{COMPRADOR.DNI}}**                            |

## Descripción del vehiculo

> Banda azul corporativa de 8 mm de alto con el título.

| Campo               | Valor                          |
| ------------------- | ------------------------------ |
| Marca y modelo:     | **{{VEHICULO.MARCA_MODELO}}**  |
| Numero bastidor:    | {{VEHICULO.BASTIDOR}}          |
| Km. Recorridos:     | {{VEHICULO.KM}}                |
| Matricula:          | {{VEHICULO.MATRICULA}}         |
| Numero cuenta:      | {{CUENTA_BANCARIA}}            |

## Totales

> Alineado a la derecha, con línea azul corporativa MidCar arriba y abajo.

|                          |                          |
| ------------------------ | -----------------------: |
| Total neto:              | **{{BASE_IMPONIBLE}}**   |
| Total IVA ({{IVA_PCT}}): | **{{IVA_IMPORTE}}**      |
| **Total Factura (EURO)** | **{{TOTAL}}**            |

---

### Pie centrado

> **GRACIAS POR SU CONFIANZA**

### Watermark

> Diagonal "FACTURA" en gris claro al 8 % de opacidad.

### Banda inferior MidCar

```
DOCUMENTO VERIFICABLE MIDCAR
Identificador único: {{IDENTIFICADOR_MIDCAR}}
Escanee el código QR o visite la URL para validar la autenticidad de este documento.
Verificación: {{URL_VERIFICACION}}                                  {{QR_CODE}}
```
