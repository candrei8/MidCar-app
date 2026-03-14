// Cláusulas legales para el contrato de compraventa de vehículos

export interface ClausulaCompraventa {
  numero: number;
  titulo: string;
  contenido: string;
}

export const CLAUSULAS_COMPRAVENTA: ClausulaCompraventa[] = [
  {
    numero: 1,
    titulo: 'OBJETO DEL CONTRATO',
    contenido: `El VENDEDOR transmite al COMPRADOR la propiedad del vehículo descrito en el presente contrato, libre de cargas y gravámenes, con todos los derechos y obligaciones inherentes al mismo.`
  },
  {
    numero: 2,
    titulo: 'PRECIO Y FORMA DE PAGO',
    contenido: `El precio de la compraventa es el indicado en este contrato. El COMPRADOR abonará dicho importe según la forma de pago acordada. El VENDEDOR entregará factura correspondiente a la operación.`
  },
  {
    numero: 3,
    titulo: 'ENTREGA DEL VEHÍCULO',
    contenido: `La entrega del vehículo se realizará en la fecha y lugar indicados en este contrato. El COMPRADOR deberá personarse para la recogida con su documentación identificativa en vigor. A partir de la entrega, los riesgos del vehículo serán por cuenta del COMPRADOR.`
  },
  {
    numero: 4,
    titulo: 'GARANTÍA',
    contenido: `El VENDEDOR otorga garantía sobre el vehículo según las condiciones especificadas en este contrato. La garantía cubre los defectos de funcionamiento mecánico y eléctrico que se manifiesten durante el período de garantía, siempre que no sean causados por mal uso, accidente, o falta de mantenimiento. La garantía no cubre: piezas de desgaste normal (embrague, frenos, neumáticos, batería convencional, escobillas, filtros, aceites), elementos de carrocería, tapicería, cristales, ni averías derivadas de manipulaciones no autorizadas.`
  },
  {
    numero: 5,
    titulo: 'CONFORMIDAD Y ESTADO DEL VEHÍCULO',
    contenido: `El COMPRADOR declara haber examinado el vehículo, comprobado su estado general, funcionamiento y documentación, manifestando su conformidad con el mismo. El COMPRADOR reconoce que adquiere un vehículo usado con el desgaste propio de su antigüedad y kilometraje.`
  },
  {
    numero: 6,
    titulo: 'PROCEDIMIENTO DE REPARACIÓN EN GARANTÍA',
    contenido: `En caso de avería cubierta por la garantía, el COMPRADOR deberá comunicarlo inmediatamente al VENDEDOR antes de realizar cualquier reparación. El VENDEDOR designará el taller donde se efectuará la reparación. El incumplimiento de este procedimiento podrá suponer la pérdida de la garantía. El VENDEDOR no se responsabiliza de averías producidas por la continuación de uso del vehículo tras detectarse un fallo.`
  },
  {
    numero: 7,
    titulo: 'COMUNICACIÓN DE AVERÍAS',
    contenido: `Toda comunicación de averías deberá realizarse por escrito (correo electrónico, SMS o mensajería instantánea) al VENDEDOR en un plazo máximo de 48 horas desde su detección. Deberá incluir descripción detallada del problema, fotografías si fuera posible, y el kilometraje actual del vehículo.`
  },
  {
    numero: 8,
    titulo: 'MODO DE REPARACIÓN',
    contenido: `El VENDEDOR podrá optar entre reparar, sustituir la pieza afectada por una de igual o similar calidad, o en su caso, proceder a la devolución del importe correspondiente. En ningún caso el VENDEDOR estará obligado a sustituir piezas por otras nuevas de primer equipo si existen alternativas de calidad equivalente.`
  },
  {
    numero: 9,
    titulo: 'EXCLUSIONES DE GARANTÍA',
    contenido: `Quedan expresamente excluidos de la garantía:
a) Daños por accidente, negligencia, uso indebido o competición.
b) Averías por falta de mantenimiento según especificaciones del fabricante.
c) Manipulaciones o reparaciones realizadas por talleres no autorizados por el VENDEDOR.
d) Daños por inundación, incendio, vandalismo o catástrofes naturales.
e) Piezas de desgaste y consumibles.
f) Defectos estéticos o de carrocería.
g) Daños derivados del uso de combustibles o lubricantes inadecuados.`
  },
  {
    numero: 10,
    titulo: 'DOCUMENTACIÓN',
    contenido: `El VENDEDOR entregará al COMPRADOR toda la documentación del vehículo en regla: Permiso de Circulación, Ficha Técnica, último recibo del Impuesto de Circulación pagado, contrato de compraventa firmado, y en su caso, llaves de repuesto y manuales del vehículo.`
  },
  {
    numero: 11,
    titulo: 'JURISDICCIÓN Y LEY APLICABLE',
    contenido: `Para cualquier controversia derivada del presente contrato, ambas partes se someten expresamente a los Juzgados y Tribunales del domicilio del comprador, renunciando a cualquier otro fuero que pudiera corresponderles. El presente contrato se rige por la legislación española, en particular por el Real Decreto Legislativo 1/2007 por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios.`
  }
];

export const TEXTO_REUNIDOS_VENDEDOR = `De una parte, como VENDEDOR:`;
export const TEXTO_REUNIDOS_COMPRADOR = `De otra parte, como COMPRADOR:`;

export const TEXTO_EXPONEN = `
Que el VENDEDOR es propietario del vehículo que se describe a continuación, el cual se encuentra al corriente de pago de impuestos y libre de cargas, embargos y gravámenes.

Que el COMPRADOR está interesado en adquirir dicho vehículo, y ambas partes han acordado llevar a cabo la presente compraventa con arreglo a las siguientes:
`;

export const TEXTO_ESTIPULACIONES = `ESTIPULACIONES`;

export const TEXTO_FIRMAS = `
Y en prueba de conformidad con cuanto antecede, ambas partes firman el presente contrato por duplicado y a un solo efecto, en el lugar y fecha indicados.
`;
