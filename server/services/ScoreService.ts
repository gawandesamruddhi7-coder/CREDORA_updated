import { prisma } from "../prisma.js";
import { AppError } from "../errors.js";

export const scoreWeights = {
  paymentHistory: 0.3,
  creditUtilisation: 0.2,
  debtBurden: 0.2,
  creditHistory: 0.15,
  recentActivity: 0.15,
} as const;

export interface ScoreFactors {
  paymentHistory: number;
  creditUtilisation: number;
  debtBurden: number;
  creditHistory: number;
  recentActivity: number;
}

interface ScoredLoan {
  principalAmount: number;
  outstandingAmount: number;
  monthlyEmi: number;
  missedPayments: number | null;
  startDate: Date;
  status?: string;
}

export function calculateScoreFactors(
  income: { monthlyIncome: number; otherMonthlyIncome: number },
  loans: ScoredLoan[],
  now = Date.now(),
): ScoreFactors {
  const monthlyIncome = income.monthlyIncome + income.otherMonthlyIncome;
  const activeLoans = loans.filter((loan) => loan.status !== "CLOSED");
  const principal = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);
  const outstanding = activeLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0);
  const monthlyEmis = activeLoans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  const reportedPayments = loans.filter((loan) => loan.missedPayments !== null);
  const missedPayments = reportedPayments.reduce((sum, loan) => sum + (loan.missedPayments ?? 0), 0);
  const oldestLoanDate = loans.reduce<Date | null>(
    (oldest, loan) => (!oldest || loan.startDate < oldest ? loan.startDate : oldest),
    null,
  );
  const recentLoans = loans.filter(
    (loan) => loan.startDate.getTime() >= now - 365 * 24 * 60 * 60 * 1000,
  ).length;

  return {
    paymentHistory: reportedPayments.length
      ? clamp(100 - (missedPayments / reportedPayments.length) * 20)
      : 50,
    creditUtilisation: principal ? clamp(100 - (outstanding / principal) * 100) : 65,
    debtBurden: monthlyIncome ? clamp(100 - (monthlyEmis / monthlyIncome) * 100) : 0,
    creditHistory: oldestLoanDate
      ? clamp(((now - oldestLoanDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000 / 12) / 60) * 100)
      : 35,
    recentActivity: clamp(100 - recentLoans * 20),
  };
}

export function calculateCredoraScore(factors: ScoreFactors) {
  const weighted =
    factors.paymentHistory * scoreWeights.paymentHistory +
    factors.creditUtilisation * scoreWeights.creditUtilisation +
    factors.debtBurden * scoreWeights.debtBurden +
    factors.creditHistory * scoreWeights.creditHistory +
    factors.recentActivity * scoreWeights.recentActivity;
  return Math.round(300 + weighted * 6);
}

function clamp(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export class ScoreService {
  async recalculateIfReady(userId: string) {
    const data = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { income: true, loans: true },
    });
    if (!data.income || data.income.monthlyIncome + data.income.otherMonthlyIncome <= 0) return null;

    const factors = calculateScoreFactors(data.income, data.loans);
    return prisma.score.create({
      data: {
        userId,
        score: calculateCredoraScore(factors),
        paymentHistoryScore: factors.paymentHistory,
        creditUtilisationScore: factors.creditUtilisation,
        debtBurdenScore: factors.debtBurden,
        creditHistoryScore: factors.creditHistory,
        recentActivityScore: factors.recentActivity,
      },
    });
  }

  async getLatest(userId: string) {
    return prisma.score.findFirst({ where: { userId }, orderBy: { calculatedAt: "desc" } });
  }

  async calculateProjection(userId: string, amount: number, monthlyEmi: number) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { income: true, loans: true },
    });
    if (!user.income || user.income.monthlyIncome + user.income.otherMonthlyIncome <= 0) {
      throw new AppError("Complete your income details before calculating a Credora Score.", 409);
    }
    const projected = [
      ...user.loans,
      {
        principalAmount: amount,
        outstandingAmount: amount,
        monthlyEmi,
        missedPayments: 0,
        startDate: new Date(),
        status: "ACTIVE",
      },
    ];
    const factors = calculateScoreFactors(user.income, projected);
    return { score: calculateCredoraScore(factors), factors };
  }
}
