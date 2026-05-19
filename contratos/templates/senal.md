# CONTRATO DE SEÑAL DE COMPRAVENTA DE VEHÍCULO

> Plantilla fiel al modelo oficial usado por MidCar. Renderizado por
> `src/lib/documents/templates/senal-template.ts` con las cláusulas en
> `src/lib/documents/clauses/senal-clauses.ts`.

---

> _Esquina superior derecha:_ **En {{LUGAR}} a {{FECHA}} a las {{HORA}} horas**

## REUNIDOS

DE UNA PARTE, **{{VENDEDOR}}**, con **NIE {{VENDEDOR.DNI}}**, con domicilio en
**{{VENDEDOR.DIRECCION}}**. En adelante el **VENDEDOR**.

Y DE OTRA PARTE, **{{COMPRADOR}}**, con **NIE {{COMPRADOR.DNI}}** y con
domicilio en **{{COMPRADOR.DIRECCION}}**. En adelante el **COMPRADOR**.

Ambas partes se reconocen, en la representación en que respectivamente
intervienen, la capacidad legal necesaria para formalizar el presente contrato
de COMPRAVENTA a cuyo efecto.

## MANIFIESTAN

**I.-** Que a ambas partes interesa formalizar el presente CONTRATO DE
COMPRAVENTA del vehículo cuyas características son las siguientes:

- ✓ Matrícula: **{{VEHICULO.MATRICULA}}**
- ✓ Marca y tipo: **{{VEHICULO.MARCA_MODELO}}**
- ✓ Número de bastidor: **{{VEHICULO.BASTIDOR}}**
- ✓ Kilometraje: {{VEHICULO.KM}}
- ✓ Cantidad señal: {{IMPORTE_SENAL}}
- ✓ Precio Total de la Compraventa: **{{PRECIO}}**
- ✓ Número de cuenta **Caixa**: **{{CUENTA_BANCARIA}}**

**II.-** Que el COMPRADOR, está interesado en la adquisición del vehículo
anteriormente descrito, y el VENDEDOR está interesado en su venta; a tales
efectos, formalizan el presente CONTRATO DE COMPRAVENTA, el cual sujetan a las
siguientes.

## ESTIPULACIONES

**PRIMERA.-** La parte vendedora se obliga a vender a la compradora el vehículo
anteriormente descrito.

El precio total que se pacta por la compraventa del vehículo es de
**{{PRECIO_LETRAS}}** (**{{PRECIO}}**)

**SEGUNDA.-** El vendedor facilitará los distintos documentos relativos al
vehículo para que quede correctamente inscrito a nombre del comprador en los
correspondientes organismos públicos.

Asimismo declara que no pesa sobre el vehículo ninguna carga, gravamen,
impuesto, deuda o sanción pendientes de abono en la fecha de la firma de este
contrato y que no ha sufrido daños estructurales, comprometiéndose en caso
contrario a regularizar tal situación a su exclusivo cargo.

En todo caso, desde la retirada del vehículo de las dependencias del vendedor,
el vendedor entrega materialmente al comprador la posesión del vehículo,
haciéndose el comprador cargo desde ese momento de cuantas responsabilidades
puedan contraerse por la propiedad del vehículo y su tenencia y uso a partir de
dicho momento de la entrega, independientemente de la obligación de registrar el
vehículo a su nombre en Tráfico por medio de la correspondiente transferencia.

**TERCERA.-** Desde la firma del presente contrato de compraventa, la parte
compradora se obliga al pago de la totalidad del precio estipulado por la
compraventa y a retirar el vehículo de las dependencias del vendedor en el plazo
máximo de Quince (15) días.

En caso de transcurrir los Quince (15) días sin haber pagado la totalidad del
precio que ahora se estipula y sin haber retirado el vehículo de las
dependencias del vendedor, este último quedará en total libertad de vender el
vehículo a cualquier otra persona física o jurídica, perdiendo el comprador la
cantidad dejada en señal.

**CUARTA.-** El comprador declara conocer perfectamente el estado actual del
vehículo y se muestra conforme con el mismo.

**QUINTA.-** Las partes, con renuncia expresa al fuero que pudiera
corresponderles, se someten a la Jurisdicción y Competencia de los Juzgados y
Tribunales de **{{LUGAR}}** para la resolución de cualquier controversia que
pudiera surgir en la interpretación y cumplimiento de este contrato.

Leído el presente contrato las partes lo encuentran conforme con su voluntad por
lo que lo firman en todas sus hojas y por duplicado a los únicos efectos de su
cumplimiento, afirmándose y ratificándose en el lugar y fecha arriba indicados.

> _De acuerdo con lo que establece la Ley Orgánica 15/1999, de 13 de diciembre,
> de Protección de Datos de Carácter Personal, le informamos que los datos
> recabados serán incorporados a un fichero bajo la responsabilidad de
> **{{VENDEDOR}}** con la finalidad de atender los compromisos derivados de la
> relación que mantenemos con usted._
>
> _Así mismo, le informamos que puede ejercer sus derechos de acceso,
> cancelación, rectificación y oposición mediante un escrito a nuestra
> dirección: {{VENDEDOR.DIRECCION}}._

## Firmas

```
__________________________            __________________________
       {{VENDEDOR}}                            {{COMPRADOR}}
        VENDEDOR                          Comprador (FIRMA Y DNI)
```

---

### Pie del documento (impreso por MidCar)

```
DOCUMENTO VERIFICABLE MIDCAR
Identificador único: {{IDENTIFICADOR_MIDCAR}}
Escanee el código QR o visite la URL para validar la autenticidad de este documento.
Verificación: {{URL_VERIFICACION}}                                  {{QR_CODE}}
```
