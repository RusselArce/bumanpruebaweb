export const crearFormateadorMoneda = (simbolo: string) => (n: number) =>
  `${simbolo} ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)}`;
