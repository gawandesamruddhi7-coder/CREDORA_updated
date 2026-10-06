import { prisma } from "../prisma.js";
import { AppError } from "../errors.js";
import type { ScenarioInput } from "../validation.js";
import { ScoreService } from "./ScoreService.js";

export class CalculatorService {
  private readonly scores = new ScoreService();

  calculateEmi(amount: number, annualRate: number, months: number) {
    const monthlyRate = annualRate / 1200;
    if (!monthlyRate) return amount / months;
    const factor = (1 + monthlyRate) ** months;
    return (amount * monthlyRate * factor) / (factor - 1);
  }

  async calculate(userId: string, input: Omit<ScenarioInput, "name">) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        income: true,
        expense: true,
        loans: { where: { status: "ACTIVE" } },
      },
    });
    const monthlyIncome = (user.income?.monthlyIncome ?? 0) + (user.income?.otherMonthlyIncome ?? 0);
    if (!monthlyIncome) throw new AppError("Complete your income details before using the calculator.", 409);

    const activeLoans = user.loans;
    const currentEmi = activeLoans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
    const currentDebt = activeLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0);
    const monthlyExpenses = user.expense
      ? user.expense.rent + user.expense.utilities + user.expense.food +
        user.expense.transportation + user.expense.insurance + user.expense.otherExpenses
      : 0;
    const emi = this.calculateEmi(input.loanAmount, input.interestRate, input.tenureMonths);
    const projectedEmi = currentEmi + emi;
    const projectedDti = (projectedEmi / monthlyIncome) * 100;
    const projectedDisposableIncome = monthlyIncome - monthlyExpenses - projectedEmi;
    const projection = await this.scores.calculateProjection(userId, input.loanAmount, emi);
    const currentScore = await this.scores.getLatest(userId);

    return {
      loanType: input.loanType,
      loanAmount: input.loanAmount,
      interestRate: input.interestRate,
      tenureMonths: input.tenureMonths,
      processingFee: input.processingFee,
      calculatedEmi: emi,
      current: {
        score: currentScore?.score ?? null,
        monthlyEmi: currentEmi,
        dti: (currentEmi / monthlyIncome) * 100,
        disposableIncome: monthlyIncome - monthlyExpenses - currentEmi,
        outstandingDebt: currentDebt,
      },
      projected: {
        score: projection.score,
        scoreFactors: projection.factors,
        monthlyEmi: projectedEmi,
        dti: projectedDti,
        disposableIncome: projectedDisposableIncome,
        outstandingDebt: currentDebt + input.loanAmount,
        totalInterest: Math.max(0, emi * input.tenureMonths - input.loanAmount),
      },
    };
  }

  async save(userId: string, input: ScenarioInput) {
    const result = await this.calculate(userId, input);
    return prisma.loanScenario.create({
      data: {
        userId,
        name: input.name,
        loanType: input.loanType,
        loanAmount: input.loanAmount,
        interestRate: input.interestRate,
        tenureMonths: input.tenureMonths,
        processingFee: input.processingFee,
        calculatedEmi: result.calculatedEmi,
        projectedScore: result.projected.score,
        projectedDti: result.projected.dti,
        projectedDisposableIncome: result.projected.disposableIncome,
      },
    });
  }

  async list(userId: string) {
    return prisma.loanScenario.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async delete(userId: string, id: string) {
    const scenario = await prisma.loanScenario.findFirst({ where: { id, userId }, select: { id: true } });
    if (!scenario) throw new AppError("Scenario not found.", 404);
    await prisma.loanScenario.delete({ where: { id } });
  }
}
