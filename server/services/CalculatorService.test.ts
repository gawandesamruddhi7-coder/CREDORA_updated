import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CalculatorService } from "./CalculatorService.js";

describe("loan EMI calculation", () => {
  const calculator = new CalculatorService();

  it("handles an interest-free loan", () => {
    assert.equal(calculator.calculateEmi(120_000, 0, 12), 10_000);
  });

  it("uses the reducing-balance EMI formula", () => {
    const emi = calculator.calculateEmi(100_000, 12, 12);
    assert.ok(Math.abs(emi - 8_884.88) < 0.01);
  });
});
