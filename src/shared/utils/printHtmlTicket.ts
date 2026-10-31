// Abre (o reutiliza) una ventana emergente, escribe el HTML del ticket y dispara
// el diálogo de impresión del navegador. Reemplaza a pdfmake: en este proyecto
// pdfmake 0.3.x se queda colgado generando el PDF (promesa que nunca resuelve
// ni rechaza), así que imprimimos HTML directo, que es lo estándar para
// ticketeras térmicas (ej. 3nStar) vía el diálogo de impresión del navegador.
export function printHtmlTicket(html: string, popupWindow?: Window | null) {
  const target =
    popupWindow && !popupWindow.closed
      ? popupWindow
      : window.open("", "ticket_print_window", "width=430,height=900");

  if (!target) {
    throw new Error(
      "No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes.",
    );
  }

  target.document.open();
  target.document.write(html);
  target.document.close();

  target.focus();

  setTimeout(() => {
    try {
      target.focus();
      target.print();
    } catch {
      // noop
    }
  }, 350);
}
