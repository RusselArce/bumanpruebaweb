import QRCode from "qrcode";
import { numeroALetras, urlToBase64 } from "@/shared/utils/Conversiones";
import { printHtmlTicket } from "@/shared/utils/printHtmlTicket";

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );

const TicketVenta = async (
  output: "print" | "html",
  data: any,
  popupWindow?: Window | null,
) => {
  const dataVenta = data?.dataventas ?? {};
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const listaMetodosPago = Array.isArray(data?.metodosPago) ? data.metodosPago : [];
  const fechaCompleta = dataVenta?.fecha;
  const fechaObj = new Date(fechaCompleta);
  const simboloMoneda = data.dataempresa?.simbolo_moneda ?? "S/";
  const textoTotal = numeroALetras(
    Number(dataVenta?.monto_total ?? 0) + Number(dataVenta?.propina ?? 0),
    data.dataempresa?.nombre_moneda,
  );
  const fecha = fechaObj.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = fechaObj.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fallbackLogo =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9Ijk2IiB2aWV3Qm94PSIwIDAgMjQwIDk2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iOTYiIHJ4PSIxMiIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjEyMCIgeT0iNTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjcwMCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzMzNDc1OCI+RU1QUkVTQTwvdGV4dD48L3N2Zz4=";

  const logoSource = data?.dataempresa?.logo;
  let logoempresa = fallbackLogo;
  if (typeof logoSource === "string" && logoSource.trim() && logoSource !== "-") {
    try {
      logoempresa = await urlToBase64(logoSource);
    } catch {
      logoempresa = fallbackLogo;
    }
  }

  let qrDataUrl = "";
  try {
    const qrContent = `${data.dataempresa?.id_fiscal}|${dataVenta.nro_comprobante}|${dataVenta.monto_total}|${dataVenta.sub_total}|${dataVenta.total_impuestos}|${fecha}${hora}|`;
    qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 160 });
  } catch {
    qrDataUrl = "";
  }

  const filasProductos = listaProductos
    .map((item: any) => {
      const modificadores = Array.isArray(item.modificadores) ? item.modificadores : [];
      const filaModificadores = modificadores.length
        ? `<tr><td colspan="4" class="desc" style="padding-left:8px;font-size:11px;">${escapeHtml(
            modificadores.map((m: any) => `+ ${m.nombre}`).join(", "),
          )}</td></tr>`
        : "";

      return `
        <tr>
          <td colspan="4" class="desc">${escapeHtml(item.productos?.codigo_barras)} - ${escapeHtml(item.productos?.nombre)}</td>
        </tr>
        ${filaModificadores}
        <tr>
          <td class="cant center">${escapeHtml(item.cantidad)}</td>
          <td class="um center">unidad</td>
          <td class="precio right">${Number(item.precio_venta ?? 0).toFixed(2)}</td>
          <td class="tot right">${Number(item.total ?? 0).toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  const filasFormaPago = listaMetodosPago
    .map((item: any) => {
      const esEfectivo = String(item.tipo ?? "").toLowerCase().trim() === "efectivo";
      return `
        <tr>
          <td class="label">${escapeHtml(item.tipo)}:</td>
          <td class="valor">${simboloMoneda} ${Number(item.monto ?? 0).toFixed(2)}</td>
        </tr>
        ${
          esEfectivo
            ? `<tr><td></td><td class="valor" style="font-weight:normal;">Vuelto: ${simboloMoneda} ${Number(item.vuelto ?? 0).toFixed(2)}</td></tr>`
            : ""
        }`;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(data.nombreComprobante ?? "Ticket")}</title>
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
  .right { text-align: right; }
  .bold { font-weight: bold; }
  img.logo { display: block; margin: 0 auto 4px; max-width: 55mm; max-height: 20mm; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead td { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; }
  td { padding: 2px 0; vertical-align: top; }
  .cant { width: 20%; } .um { width: 20%; } .precio { width: 30%; } .tot { width: 30%; }
  .totales .label { text-align: left; font-weight: bold; }
  .totales .valor { text-align: right; font-weight: bold; }
  .cliente-row { display: flex; }
  .cliente-label { width: 26%; font-size: 11px; text-align: right; padding-right: 4px; }
  .cliente-valor { width: 74%; font-size: 11px; font-weight: bold; }
  .qr { text-align: center; margin-top: 8px; }
  .qr img { width: 40mm; height: 40mm; }
  .link { text-align: center; font-size: 11px; font-weight: bold; margin-top: 2px; }
  @media print { body { width: 76mm; } }
</style>
</head>
<body>
  <img class="logo" src="${logoempresa}" />
  <div class="center bold">${escapeHtml(data.dataempresa?.nombre)}</div>
  <div class="center">${escapeHtml(data.dataempresa?.direccion_fiscal)}</div>
  <div class="center">${escapeHtml(data.dataempresa?.id_fiscal)}</div>

  <div class="center bold" style="margin-top:6px;">${escapeHtml(data.nombreComprobante)}</div>
  <div class="center">${escapeHtml(dataVenta?.nro_comprobante)}</div>

  <div class="sep"></div>
  <div class="cliente-row"><div class="cliente-label">FECHA:</div><div class="cliente-valor">${escapeHtml(fecha)}   HORA: ${escapeHtml(hora)}</div></div>
  <div class="cliente-row"><div class="cliente-label">CAJERO:</div><div class="cliente-valor">${escapeHtml(data.nombrecajero)}</div></div>

  <div class="sep"></div>
  <div class="bold">CLIENTE:</div>
  <div class="cliente-row"><div class="cliente-label">NOMBRES:</div><div class="cliente-valor">${escapeHtml(data.dataCliente?.nombres || "Generico")}</div></div>
  <div class="cliente-row"><div class="cliente-label">DOC.ID:</div><div class="cliente-valor">${escapeHtml(data.dataCliente?.identificador_fiscal || "-")}</div></div>
  <div class="cliente-row"><div class="cliente-label">DIRECC.:</div><div class="cliente-valor">${escapeHtml(data.dataCliente?.direccion || "-")}</div></div>

  <div class="sep"></div>
  <table>
    <thead>
      <tr>
        <td class="cant">CANT.</td>
        <td class="um center">UM</td>
        <td class="precio right">PRECIO</td>
        <td class="tot right">TOTAL</td>
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
      <td class="valor">${simboloMoneda} ${Number(dataVenta?.sub_total ?? 0).toFixed(2)}</td>
    </tr>
    <tr>
      <td class="label">${escapeHtml(data.dataempresa?.impuesto ?? "IGV")}:</td>
      <td class="valor">${simboloMoneda} ${Number(dataVenta?.total_impuestos ?? 0).toFixed(2)}</td>
    </tr>
    ${
      Number(dataVenta?.propina ?? 0) > 0
        ? `<tr>
      <td class="label">PROPINA:</td>
      <td class="valor">${simboloMoneda} ${Number(dataVenta?.propina ?? 0).toFixed(2)}</td>
    </tr>`
        : ""
    }
    <tr>
      <td class="label" style="font-size:14px;">TOTAL:</td>
      <td class="valor" style="font-size:14px;">${simboloMoneda} ${(Number(dataVenta?.monto_total ?? 0) + Number(dataVenta?.propina ?? 0)).toFixed(2)}</td>
    </tr>
    ${
      Number(dataVenta?.saldo ?? 0) > 0
        ? `<tr>
      <td class="label">SALDO FIADO:</td>
      <td class="valor">${simboloMoneda} ${Number(dataVenta?.saldo ?? 0).toFixed(2)}</td>
    </tr>`
        : ""
    }
  </table>

  <div class="bold" style="margin-top:6px;">IMPORTE EN LETRAS:</div>
  <div>${escapeHtml(textoTotal)}</div>

  <div class="sep"></div>
  <div class="bold right">FORMA DE PAGO:</div>
  <table class="totales">
    ${filasFormaPago}
  </table>

  <div class="center" style="margin-top:8px;">${escapeHtml(data.dataempresa?.pie_pagina_ticket)}</div>

  ${
    qrDataUrl
      ? `<div class="qr"><img src="${qrDataUrl}" /></div>
         <div class="link" style="font-weight:normal;">Representación impresa del comprobante original. Consulta tu comprobante aquí:</div>
         <div class="link">https://codigo369web.com/</div>`
      : ""
  }
</body>
</html>`;

  if (output === "html") {
    return html;
  }

  printHtmlTicket(html, popupWindow);
  return { success: true };
};

export default TicketVenta;
