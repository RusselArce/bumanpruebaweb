import { describe, expect, it } from "vitest";
import {
  ConvertirCapitalize,
  ConvertirMinusculas,
  FormatearNumeroDinero,
  numeroALetras,
} from "./Conversiones";

describe("numeroALetras", () => {
  it("convierte cero", () => {
    expect(numeroALetras(0, "SOLES")).toBe("SON: CERO CON 00/100 SOLES");
  });

  it("convierte unidades y decenas simples", () => {
    expect(numeroALetras(7, "SOLES")).toBe("SON: SIETE CON 00/100 SOLES");
    expect(numeroALetras(15, "SOLES")).toBe("SON: QUINCE CON 00/100 SOLES");
    expect(numeroALetras(30, "SOLES")).toBe("SON: TREINTA CON 00/100 SOLES");
  });

  it("usa la forma compuesta VEINTIUNO en vez de VEINTE Y UNO", () => {
    expect(numeroALetras(21, "SOLES")).toBe("SON: VEINTIUNO CON 00/100 SOLES");
    expect(numeroALetras(29, "SOLES")).toBe("SON: VEINTINUEVE CON 00/100 SOLES");
  });

  it("convierte decenas compuestas con Y", () => {
    expect(numeroALetras(45, "SOLES")).toBe("SON: CUARENTA Y CINCO CON 00/100 SOLES");
  });

  it("convierte centenas — este es el caso que estaba roto (>= 100)", () => {
    expect(numeroALetras(100, "SOLES")).toBe("SON: CIEN CON 00/100 SOLES");
    expect(numeroALetras(105, "SOLES")).toBe("SON: CIENTO CINCO CON 00/100 SOLES");
    expect(numeroALetras(150, "SOLES")).toBe("SON: CIENTO CINCUENTA CON 00/100 SOLES");
    expect(numeroALetras(999, "SOLES")).toBe(
      "SON: NOVECIENTOS NOVENTA Y NUEVE CON 00/100 SOLES",
    );
  });

  it("convierte miles", () => {
    expect(numeroALetras(1000, "SOLES")).toBe("SON: MIL CON 00/100 SOLES");
    expect(numeroALetras(1500, "SOLES")).toBe("SON: MIL QUINIENTOS CON 00/100 SOLES");
    expect(numeroALetras(2450, "SOLES")).toBe(
      "SON: DOS MIL CUATROCIENTOS CINCUENTA CON 00/100 SOLES",
    );
  });

  it("conserva los centavos", () => {
    expect(numeroALetras(150.75, "SOLES")).toBe(
      "SON: CIENTO CINCUENTA CON 75/100 SOLES",
    );
  });
});

describe("ConvertirCapitalize", () => {
  it("pone en mayúscula la primera letra y el resto en minúscula", () => {
    expect(ConvertirCapitalize("hOLA")).toBe("Hola");
  });
});

describe("ConvertirMinusculas", () => {
  it("convierte todo a minúsculas", () => {
    expect(ConvertirMinusculas("HOLA Mundo")).toBe("hola mundo");
  });
});

describe("FormatearNumeroDinero", () => {
  it("retorna undefined si no hay currency", () => {
    expect(FormatearNumeroDinero(10, undefined, "PE")).toBeUndefined();
  });

  it("formatea con la moneda dada", () => {
    const resultado = FormatearNumeroDinero(1234.5, "PEN", "PE");
    expect(resultado).toContain("1");
    expect(resultado).toContain("234");
  });
});
