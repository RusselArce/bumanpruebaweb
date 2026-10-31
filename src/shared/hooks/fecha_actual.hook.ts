import { useEffect, useState } from "react";

type FechaSQL = string; // "YYYY-MM-DD HH:mm:ss"

export function useFormattedDate(): FechaSQL {
  const [formattedDate, setFormattedDate] = useState<FechaSQL>("");

  useEffect(() => {
    const now = new Date();

    // Offset en ms para convertir a "hora local" antes de toISOString()
    const offsetMs = now.getTimezoneOffset() * 60_000;

    const localSqlDate = new Date(now.getTime() - offsetMs)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    setFormattedDate(localSqlDate);
  }, []);

  return formattedDate;
}
