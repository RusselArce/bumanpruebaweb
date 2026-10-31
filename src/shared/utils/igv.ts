// El total de cada línea de venta ya incluye el IGV, por lo que el desglose
// se obtiene dividiendo hacia atrás en vez de sumar el impuesto aparte.
export const IGV_PORCENTAJE_DEFECTO = 18;

export type DesgloseIgv = {
  subtotal: number;
  igv: number;
  porcentaje: number;
};

export function calcularDesgloseIgv(
  total: number,
  valorImpuesto?: number | string | null,
): DesgloseIgv {
  const porcentaje = Number(valorImpuesto ?? IGV_PORCENTAJE_DEFECTO) || 0;
  const factor = 1 + porcentaje / 100;
  const subtotal = factor > 0 ? total / factor : total;
  const igv = total - subtotal;

  return { subtotal, igv, porcentaje };
}
