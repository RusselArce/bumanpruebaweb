const formatoISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const hoyISO = () => formatoISO(new Date());

export const sumarDias = (iso: string, dias: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dias);
  return formatoISO(dt);
};

export const primerDiaDelMes = () => {
  const now = new Date();
  return formatoISO(new Date(now.getFullYear(), now.getMonth(), 1));
};
