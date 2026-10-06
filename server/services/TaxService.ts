import { prisma } from "../prisma.js";

export class TaxService {
  async estimate(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { income: true, expense: true, loans: { where: { status: "ACTIVE" } } },
    });
    const annualIncome = user.income?.annualIncome ||
      ((user.income?.monthlyIncome ?? 0) + (user.income?.otherMonthlyIncome ?? 0)) * 12;
    const annualEmi = user.loans.reduce((sum, loan) => sum + loan.monthlyEmi * 12, 0);
    const monthlyExpenses = user.expense
      ? user.expense.rent + user.expense.utilities + user.expense.food +
        user.expense.transportation + user.expense.insurance + user.expense.otherExpenses
      : 0;
    const tax = this.calculateEstimatedTax(annualIncome);
    const annualExpenses = monthlyExpenses * 12;

    return {
      annualIncome,
      estimatedTax: tax,
      annualEmi,
      annualExpenses,
      estimatedDisposableIncome: annualIncome - tax - annualEmi - annualExpenses,
      taxRate: annualIncome ? (tax / annualIncome) * 100 : 0,
      estimateBasis: "Illustrative progressive-slab estimate; excludes deductions, rebates, cess and other individual circumstances.",
    };
  }

  private calculateEstimatedTax(income: number) {
    const slabs: [number, number][] = [
      [400_000, 0],
      [800_000, 0.05],
      [1_200_000, 0.1],
      [1_600_000, 0.15],
      [2_000_000, 0.2],
      [2_400_000, 0.25],
      [Number.POSITIVE_INFINITY, 0.3],
    ];
    let tax = 0;
    let floor = 0;
    for (const [ceiling, rate] of slabs) {
      if (income <= floor) break;
      tax += (Math.min(income, ceiling) - floor) * rate;
      floor = ceiling;
    }
    return Math.round(tax);
  }
}
