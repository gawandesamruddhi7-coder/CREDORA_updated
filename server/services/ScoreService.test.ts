import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateCredoraScore, calculateScoreFactors } from "./ScoreService.js";

describe("Credora score calculation", () => {
  it("uses neutral payment history when no repayments were reported", () => {
    const factors = calculateScoreFactors(
      { monthlyIncome: 100_000, otherMonthlyIncome: 0 },
      [{
        principalAmount: 200_000,
        outstandingAmount: 100_000,
        monthlyEmi: 20_000,
        missedPayments: null,
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        status: "ACTIVE",
      }],
      new Date("2025-07-01T00:00:00.000Z").getTime(),
    );

    assert.equal(factors.paymentHistory, 50);
    assert.equal(factors.creditUtilisation, 50);
    assert.equal(factors.debtBurden, 80);
    assert.equal(factors.recentActivity, 80);
  });

  it("applies the documented factor weights and score range", () => {
    assert.equal(calculateCredoraScore({
      paymentHistory: 100,
      creditUtilisation: 100,
      debtBurden: 100,
      creditHistory: 100,
      recentActivity: 100,
    }), 900);
    assert.equal(calculateCredoraScore({
      paymentHistory: 0,
      creditUtilisation: 0,
      debtBurden: 0,
      creditHistory: 0,
      recentActivity: 0,
    }), 300);
  });
});
