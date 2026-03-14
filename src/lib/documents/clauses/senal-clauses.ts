// Cláusulas legales para el contrato de señal/reserva de vehículos

export interface ClausulaSenal {
  numero: number;
  titulo: string;
  contenido: string;
}

export const CLAUSULAS_SENAL: ClausulaSenal[] = [
  {
    numero: 1,
    titulo: 'OBJETO DEL CONTRATO',
    contenido: `El presente contrato tiene por objeto la reserva del vehículo descrito, mediante el pago de una señal a cuenta del precio total de compraventa. El VENDEDOR se compromete a no vender ni ofrecer el vehículo a terceros mientras esté vigente esta reserva.`
  },
  {
    numero: 2,
    titulo: 'IMPORTE DE LA SEÑAL',
    contenido: `El COMPRADOR entrega en este acto la cantidad indicada como señal, que será descontada del precio total en el momento de formalizar la compraventa definitiva. Dicha cantidad ha sido abonada mediante transferencia bancaria / efectivo a la cuenta del VENDEDOR.`
  },
  {
    numero: 3,
    titulo: 'PLAZO DE VALIDEZ',
    contenido: `La presente reserva tendrá validez hasta la fecha límite indicada en este contrato. Si llegada dicha fecha el COMPRADOR no ha formalizado la compra, el VENDEDOR quedará libre para vender el vehículo a terceros, procediéndose según lo estipulado en la cláusula siguiente.`
  },
  {
    numero: 4,
    titulo: 'PENALIZACIONES',
    contenido: `Si el COMPRADOR desiste de la compra o no la formaliza en el plazo acordado sin causa justificada, perderá la totalidad de la señal entregada en concepto de indemnización por daños y perjuicios al VENDEDOR.

Si el VENDEDOR incumple su obligación de reserva vendiendo el vehículo a un tercero, deberá devolver al COMPRADOR el doble de la cantidad entregada como señal.

Se consideran causas justificadas de desistimiento sin penalización: la denegación de financiación cuando esta estuviera expresamente condicionada en el contrato, o defectos ocultos graves no manifestados previamente.`
  },
  {
    numero: 5,
    titulo: 'FORMALIZACIÓN DE LA COMPRAVENTA',
    contenido: `Una vez abonado el importe restante hasta completar el precio total, se formalizará el contrato de compraventa definitivo, procediéndose a la entrega del vehículo y toda su documentación. El COMPRADOR dispondrá de un plazo de 5 días hábiles desde la comunicación de disponibilidad del vehículo para formalizar la operación.`
  }
];

export const TEXTO_MANIFIESTAN = `
PRIMERO: Que el VENDEDOR es legítimo propietario del vehículo que se describe a continuación, encontrándose el mismo libre de cargas, gravámenes y al corriente de pago de todos los impuestos.

SEGUNDO: Que el COMPRADOR está interesado en la adquisición del citado vehículo y desea reservarlo mediante el pago de una señal.

TERCERO: Que ambas partes, reconociéndose mutuamente capacidad legal suficiente para contratar y obligarse, acuerdan formalizar el presente CONTRATO DE SEÑAL con arreglo a las siguientes:
`;

export const TEXTO_ESTIPULACIONES_SENAL = `ESTIPULACIONES`;

export const TEXTO_FIRMAS_SENAL = `
Y para que conste y en prueba de conformidad, ambas partes firman el presente documento por duplicado ejemplar y a un solo efecto, en el lugar y fecha arriba indicados.
`;
