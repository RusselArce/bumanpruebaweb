import { printHtmlTicket } from "@/shared/utils/printHtmlTicket";

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );

const PrecuentaTicket = async (
  output: "print" | "html",
  data: any,
  popupWindow?: Window | null,
) => {
  const dataEmpresa = data?.dataempresa ?? {};
  const dataMesa = data?.dataMesa ?? {};
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const simboloMoneda = dataEmpresa?.simbolo_moneda ?? "S/";
  const subtotal = Number(data?.subtotal ?? 0);
  const igv = Number(data?.igv ?? 0);
  const total = Number(data?.total ?? 0);
  const porcentajeIgv = data?.porcentajeIgv ?? 18;

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = ahora.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const filasProductos = listaProductos
    .map(
      (item: any) => `
        <tr>
          <td class="cant">${escapeHtml(item.cantidad)}</td>
          <td class="desc">${escapeHtml(item.descripcion ?? item.productos?.nombre ?? "-")}</td>
          <td class="tot">${Number(item.total ?? 0).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Precuenta</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    width: 76mm;
    margin: 0 auto;
    padding: 4mm 3mm;
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  h1 { font-size: 15px; margin: 6px 0 2px; text-align: center; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead td { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; }
  td { padding: 2px 0; vertical-align: top; }
  .cant { width: 15%; }
  .desc { width: 60%; }
  .tot { width: 25%; text-align: right; }
  .totales td { padding: 1px 0; }
  .totales .label { text-align: left; font-weight: bold; }
  .totales .valor { text-align: right; font-weight: bold; }
  .total-final { font-size: 16px; text-align: center; margin: 6px 0; }
  .aviso { font-weight: bold; text-align: center; margin: 8px 0; }
  .campo { margin: 4px 0; }
  @media print {
    body { width: 76mm; }
  }
</style>
</head>
<body>
  <div class="center bold">${escapeHtml(dataEmpresa?.nombre)}</div>
  <div class="center">${escapeHtml(dataEmpresa?.direccion_fiscal)}</div>

  <h1>PRECUENTA</h1>
  <div class="center">RECLAME COMPROBANTE DE PAGO</div>

  <div class="sep"></div>
  <div>MESA: ${escapeHtml(dataMesa?.nombre ?? "-")}</div>
  <div>${escapeHtml(fecha)} ${escapeHtml(hora)}</div>

  <div class="sep"></div>
  <table>
    <thead>
      <tr>
        <td class="cant">CANT.</td>
        <td class="desc">DESCRIPCIÓN</td>
        <td class="tot">TOTAL</td>
      </tr>
    </thead>
    <tbody>
      ${filasProductos}
    </tbody>
  </table>

  <div class="sep"></div>
  <table class="totales">
    <tr>
      <td class="label">SUBTOTAL:</td>
      <td class="valor">${simboloMoneda} ${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="label">${escapeHtml(dataEmpresa?.impuesto ?? "IGV")} (${porcentajeIgv}%):</td>
      <td class="valor">${simboloMoneda} ${igv.toFixed(2)}</td>
    </tr>
  </table>

  <div class="center" style="margin-top:6px;">Sírvase pagar esta cantidad</div>
  <div class="total-final bold">TOTAL: ${simboloMoneda} ${total.toFixed(2)}</div>

  <div class="center">Impreso @ ${escapeHtml(hora)}</div>

  <div class="sep"></div>
  <div class="aviso">NO VÁLIDO COMO COMPROBANTE DE PAGO</div>

  <div class="campo">CLIENTE: ____________________________</div>
  <div class="campo">R.U.C. / DNI: _______________________</div>
  <div class="campo">DIRECCIÓN: __________________________</div>
</body>
</html>`;

  if (output === "html") {
    return html;
  }

  printHtmlTicket(html, popupWindow);
  return { success: true };
};

export default PrecuentaTicket;
