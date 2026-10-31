import { describe, expect, it } from "vitest";
import { calcularDesgloseIgv, IGV_PORCENTAJE_DEFECTO } from "./igv";

describe("calcularDesgloseIgv", () => {
  it("usa 18% por defecto cuando no se pasa valorImpuesto", () => {
    const { subtotal, igv, porcentaje } = calcularDesgloseIgv(118);
    expect(porcentaje).toBe(IGV_PORCENTAJE_DEFECTO);
    expect(subtotal).toBeCloseTo(100, 5);
    expect(igv).toBeCloseTo(18, 5);
  });

  it("respeta un porcentaje distinto", () => {
    const { subtotal, igv } = calcularDesgloseIgv(110, 10);
    expect(subtotal).toBeCloseTo(100, 5);
    expect(igv).toBeCloseTo(10, 5);
  });

  it("trata total 0 correctamente", () => {
    const { subtotal, igv } = calcularDesgloseIgv(0);
    expect(subtotal).toBe(0);
    expect(igv).toBe(0);
  });

  it("no divide por cero cuando el porcentaje hace el factor <= 0", () => {
    const { subtotal, igv } = calcularDesgloseIgv(100, -100);
    expect(subtotal).toBe(100);
    expect(igv).toBe(0);
  });

  it("acepta el porcentaje como string, como llega a veces desde la BD", () => {
    const { subtotal } = calcularDesgloseIgv(118, "18");
    expect(subtotal).toBeCloseTo(100, 5);
  });

  it("trata null/undefined como el valor por defecto", () => {
    expect(calcularDesgloseIgv(118, null).porcentaje).toBe(IGV_PORCENTAJE_DEFECTO);
    expect(calcularDesgloseIgv(118, undefined).porcentaje).toBe(IGV_PORCENTAJE_DEFECTO);
  });
});
