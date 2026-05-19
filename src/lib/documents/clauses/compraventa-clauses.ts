// Cláusulas legales del CONTRATO DE COMPRAVENTA Y GARANTÍA DE VEHÍCULO DE
// OCASIÓN (V.O.). Texto íntegro extraído del modelo oficial utilizado por
// MidCar (artículo 120.1 del Texto refundido de la Ley general para la defensa
// de los consumidores y usuarios, modificado por Real Decreto-ley 7/2021).

export interface ClausulaCompraventa {
  numero: string; // PRIMERA, SEGUNDA, ...
  titulo?: string;
  contenido: string;
}

export const TITULO_COMPRAVENTA =
  'CONTRATO DE COMPRAVENTA Y GARANTIA DE VEHÍCULO DE OCASIÓN (V.O.)';

export const TEXTO_EXPONEN_COMPRAVENTA =
  'I.- Que ambas partes de común acuerdo han convenido formalizar la compraventa y ' +
  'garantía legal del vehículo usado cuyas características básicas son las siguientes:';

export const TEXTO_ANEXO_COMPRAVENTA =
  'II.- Que el estado del vehículo, en su conjunto y en el de sus elementos y ' +
  'componentes fundamentales, su antigüedad y kilometraje, se recogen en el Anexo ' +
  'del presente contrato que firman ambas partes y que se incorpora al mismo como ' +
  'parte integrante e inseparable del mismo.';

export const TEXTO_MANIFESTACIONES_COMPRADOR =
  'III.- Que el comprador manifiesta que:';

export const TEXTO_LEGAL_CAPACIDAD_COMPRAVENTA =
  'V.- Ambas partes se reconocen capacidad legal para este acto, y convienen el ' +
  'presente contrato de compraventa del vehículo mencionado, de acuerdo con las ' +
  'siguientes:';

export const CLAUSULAS_COMPRAVENTA: ClausulaCompraventa[] = [
  {
    numero: 'PRIMERA',
    contenido:
      '{{VENDEDOR}} en la representación que ostenta, VENDE a {{COMPRADOR}} que ' +
      'COMPRA el vehículo reseñado en el exponente I anterior, en el estado técnico ' +
      'y de conservación que se refleja en el ANEXO del presente contrato.'
  },
  {
    numero: 'SEGUNDA',
    contenido:
      'El precio de la compraventa, teniendo en cuenta las características del ' +
      'vehículo, su antigüedad y kilometraje, se PACTA de común acuerdo en ' +
      '{{PRECIO}} euros, en cuyo importe queda incluido:\n' +
      'a) El precio del vehículo propiamente dicho, en el estado y circunstancias que se contemplan en el Anexo.\n' +
      'b) El IVA.\n' +
      'c) Los gastos de transferencia, pero no las tasas e impuestos que gravan al comprador.'
  },
  {
    numero: 'TERCERA',
    contenido:
      'El vendedor, en este acto, hace entrega al comprador del vehículo objeto de ' +
      'la presente compraventa, haciéndose este último responsable desde la fecha del ' +
      'presente contrato, de cuantas cuestiones pudieran derivarse del uso o ' +
      'posesión del mismo, incluidas responsabilidades y sanciones de cualquier tipo. ' +
      'De la misma manera, el vendedor se hace responsable de cuantas cuestiones ' +
      'pudieran derivarse en este sentido hasta la fecha del presente contrato.'
  },
  {
    numero: 'CUARTA',
    contenido:
      'El plazo de garantía legal PACTADO en este contrato, es de {{MESES_GARANTIA}} meses, a ' +
      'partir de la fecha de la entrega del vehículo.'
  },
  {
    numero: 'QUINTA',
    contenido:
      'El vendedor responderá ante el consumidor destinatario final, de cualquier ' +
      'falta de conformidad que exista en el momento de la entrega del vehículo. En ' +
      'los términos del Texto refundido de la Ley general para la defensa de los ' +
      'consumidores y usuarios y otras leyes complementarias, se reconoce al ' +
      'consumidor el derecho a la reparación del vehículo, la rebaja del precio o la ' +
      'resolución del contrato. Se entiende que el vehículo es conforme al contrato, ' +
      'salvo prueba en contrario, cuando se ajuste a la descripción realizada por el ' +
      'vendedor en el Anexo al presente contrato; sea apto para el uso a que ' +
      'ordinariamente se destinen vehículos del mismo tipo; presente la calidad y ' +
      'prestaciones habituales de un vehículo del mismo tipo que el consumidor pueda ' +
      'fundadamente esperar, habida cuenta de su naturaleza.\n' +
      'No habrá lugar a responsabilidad por las faltas de conformidad que el ' +
      'consumidor conociera o no hubiera podido fundadamente ignorar en el momento ' +
      'de la celebración del contrato, así como por aquellas de las que haya sido ' +
      'informado de manera específica y hubiese aceptado de forma expresa y por separado.\n' +
      'La renuncia previa de los derechos que el Texto refundido de la Ley general ' +
      'para la defensa de los consumidores y usuarios y otras leyes complementarias ' +
      'reconoce a los consumidores es nula, siendo, asimismo, nulos los actos ' +
      'realizados en fraude de esa ley, de conformidad con el artículo 6 del Código Civil.'
  },
  {
    numero: 'SEXTA',
    contenido:
      'En caso de falta de conformidad del vehículo objeto de la presente ' +
      'compraventa, el beneficiario de la garantía, tendrá derecho a la reparación. ' +
      'La rebaja del precio y la resolución del contrato, procederán, a elección del ' +
      'consumidor, cuando este no pudiera exigir la reparación o no se hubiera ' +
      'llevado a cabo en plazo razonable o sin mayores inconvenientes para el ' +
      'consumidor. La resolución no procederá cuando la falta de conformidad sea de ' +
      'escasa importancia. La reparación suspende el cómputo del plazo indicado en ' +
      'la estipulación cuarta del presente contrato. El periodo de suspensión ' +
      'comenzará desde que el consumidor ponga el vehículo a disposición del vendedor ' +
      'y concluirá con la entrega al consumidor del vehículo reparado. Durante los ' +
      'doce meses posteriores a la entrega del vehículo reparado, el vendedor ' +
      'responderá de las faltas de conformidad que motivaron la reparación, ' +
      'presumiéndose que se trata de la misma falta de conformidad cuando se ' +
      'reproduzcan en el vehículo defectos del mismo origen que los inicialmente ' +
      'manifestados. El beneficiario de la garantía no podrá exigir en ningún caso ' +
      'la sustitución del vehículo usado.'
  },
  {
    numero: 'SÉPTIMA',
    contenido:
      'Para hacer valer su derecho, el titular beneficiario de la garantía deberá ' +
      'comunicar al vendedor garante la falta de conformidad apreciada, a la mayor ' +
      'brevedad posible desde que tuviera conocimiento de la misma. El ' +
      'incumplimiento de dicha comunicación no supondrá la pérdida del derecho del ' +
      'consumidor, pero éste será responsable de los daños que se ocasionen en el ' +
      'bien por el retraso en la comunicación. El vendedor garante no responderá ' +
      'respecto de aquellas partes o elementos del vehículo que fueran manipulados ' +
      'por el consumidor, ni cuando el consumidor hubiera reparado el vehículo sin ' +
      'que el vendedor garante hubiera dado su autorización o tenida ocasión de ' +
      'comprobar previamente la supuesta falta de conformidad, salvo que por las ' +
      'circunstancias en que se produjera el hecho que dio lugar a la reparación no ' +
      'fuera posible cumplir con aquellos requisitos.\n' +
      'Salvo prueba en contrario, se presumirá que las faltas de conformidad que se ' +
      'manifiesten durante el plazo de garantía pactado en la cláusula cuarta ya ' +
      'existían cuando el vehículo se entregó, excepto cuando esta presunción sea ' +
      'incompatible con la naturaleza del bien o la índole de la falta de conformidad.'
  },
  {
    numero: 'OCTAVA',
    contenido:
      'El vendedor garante una vez haya sido informado por el comprador de la falta ' +
      'de conformidad, y una vez comprobada su existencia, determinará el modo y ' +
      'manera de llevar a cabo la reparación y también el taller donde deba ser ' +
      'examinado y, en su caso, reparado, el vehículo. Esta reparación se ajustará a ' +
      'las siguientes reglas:\n' +
      '1. La reparación será gratuita para el consumidor. Esta gratuidad ' +
      'comprenderá los gastos necesarios para subsanar la falta de conformidad, ' +
      'especialmente transporte, mano de obra y materiales.\n' +
      '2. En el supuesto de que sea necesaria la incorporación de piezas de ' +
      'recambio, podrán utilizarse piezas reacondicionadas, reconstruidas o usadas, ' +
      'siempre que se cumplan los siguientes requisitos: - Que sea técnicamente ' +
      'posible la reparación del vehículo haciendo uso de tales piezas. - Que la ' +
      'pieza incorporada tenga un estado de conservación conforme al contrato. - ' +
      'Que no se trate de elementos activos o conjuntos de los sistemas de frenado, ' +
      'suspensión y dirección del vehículo. Deberá informarse por escrito al ' +
      'consumidor indicando las reparaciones efectuadas y las piezas sustituidas. ' +
      'No obstante, podrá el comprador manifestar su deseo de instalar piezas ' +
      'nuevas, con aceptación de pago del sobreprecio que ello conlleve. En este ' +
      'caso, se garantiza la conformidad con el contrato de la pieza nueva ' +
      'adquirida, en los términos del citado Texto refundido de la Ley general para ' +
      'la defensa de los consumidores y usuarios y otras leyes complementarias.'
  },
  {
    numero: 'NOVENA',
    contenido:
      'No se consideran faltas de conformidad el desgaste normal de piezas, ' +
      'materiales o componentes del vehículo. De igual modo, las averías o ' +
      'deficiencias del vehículo:\n' +
      'a) Que vengan motivadas por el normal desgaste de piezas, materiales o componentes.\n' +
      'b) Que vengan motivadas por un uso inadecuado del mismo o por la falta de ' +
      'las operaciones de mantenimiento aconsejadas por el fabricante.\n' +
      'c) Que sean consecuencia de un robo o accidente.'
  },
  {
    numero: 'DÉCIMA',
    contenido:
      'El vendedor no se hace responsable desde el momento de la venta de ningún ' +
      'tipo de documentación que precisa el vehículo.\n' +
      'Por la firma de este contrato se entiende que el comprador es responsable a ' +
      'partir del día de hoy del vehículo y la documentación necesaria o obligatoria.'
  },
  {
    numero: 'UNDÉCIMA',
    contenido:
      'Los componentes asociados con la batería, incluyendo la propia batería, ' +
      'líquidos y otras piezas relacionadas con el uso del vehículo, no están ' +
      'cubiertos por la garantía del mismo.'
  }
];

export const NOTA_PIE_PAGINA_COMPRAVENTA =
  '1 no inferior a un año según el artículo 120.1 del Texto refundido de la Ley ' +
  'general para la defensa de los consumidores y usuarios y otras leyes ' +
  'complementarias, modificado por Real Decreto-ley 7/2021';

export const TEXTO_CIERRE_COMPRAVENTA =
  'En prueba de conformidad, una vez leído el contrato y su anexo, que forma parte ' +
  'integrante e inseparable del mismo, ambas partes firman el presente documento, ' +
  'por duplicado y aun sólo efecto, en el lugar y fecha indicados en el encabezamiento.';

// Compatibilidad con código legado que aún importa estos símbolos
export const TEXTO_REUNIDOS_VENDEDOR = 'De una parte, como VENDEDOR:';
export const TEXTO_REUNIDOS_COMPRADOR = 'De otra parte, como COMPRADOR:';
export const TEXTO_EXPONEN = TEXTO_EXPONEN_COMPRAVENTA;
export const TEXTO_ESTIPULACIONES = 'ESTIPULACIONES';
export const TEXTO_FIRMAS = TEXTO_CIERRE_COMPRAVENTA;
