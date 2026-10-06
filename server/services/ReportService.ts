import { prisma } from "../prisma.js";

export class ReportService {
  async dashboard(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        income: true,
        expense: true,
        loans: { orderBy: [{ status: "asc" }, { startDate: "desc" }] },
        scores: { orderBy: { calculatedAt: "desc" }, take: 2 },
        loanScenarios: { orderBy: { createdAt: "desc" } },
      },
    });
    const activeLoans = user.loans.filter((loan) => loan.status === "ACTIVE");
    const monthlyIncome = (user.income?.monthlyIncome ?? 0) + (user.income?.otherMonthlyIncome ?? 0);
    const monthlyEmi = activeLoans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
    const outstandingDebt = activeLoans.reduce((sum, loan) => sum + loan.outstandingAmount, 0);
    const principal = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const monthlyExpenses = user.expense
      ? user.expense.rent + user.expense.utilities + user.expense.food +
        user.expense.transportation + user.expense.insurance + user.expense.otherExpenses
      : 0;
    const previousScore = user.scores[1] ?? null;

    return {
      profile: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        age: user.age,
        city: user.city,
        employmentType: user.employmentType,
        dependents: user.dependents,
        createdAt: user.createdAt,
      },
      income: user.income,
      expenses: user.expense,
      loans: user.loans,
      score: user.scores[0] ?? null,
      previousScore,
      scenarios: user.loanScenarios,
      hasFinancialProfile: monthlyIncome > 0,
      metrics: {
        monthlyIncome,
        baseMonthlyIncome: user.income?.monthlyIncome ?? 0,
        otherMonthlyIncome: user.income?.otherMonthlyIncome ?? 0,
        annualIncome: user.income?.annualIncome ?? 0,
        monthlyExpenses,
        monthlyEmi,
        outstandingDebt,
        activeLoanCount: activeLoans.length,
        debtToIncome: monthlyIncome ? (monthlyEmi / monthlyIncome) * 100 : 0,
        emiToIncome: monthlyIncome ? (monthlyEmi / monthlyIncome) * 100 : 0,
        disposableIncome: monthlyIncome - monthlyExpenses - monthlyEmi,
        repaymentProgress: principal ? ((principal - outstandingDebt) / principal) * 100 : 0,
        averageInterestRate: activeLoans.length
          ? activeLoans.reduce((sum, loan) => sum + loan.interestRate * loan.outstandingAmount, 0) /
            (outstandingDebt || 1)
          : 0,
      },
      insights: this.insights(activeLoans, monthlyIncome, monthlyEmi, outstandingDebt),
    };
  }

  private insights(
    loans: Array<{ monthlyEmi: number; outstandingAmount: number; missedPayments: number | null }>,
    income: number,
    emi: number,
    outstanding: number,
  ) {
    const observations: Array<{ tone: "positive" | "warning" | "important"; title: string; detail: string }> = [];
    if (!income) return observations;
    const dti = (emi / income) * 100;
    if (!loans.length) {
      observations.push({
        tone: "positive",
        title: "No active loans",
        detail: "No active loans are recorded in your profile.",
      });
    } else if (dti >= 40) {
      observations.push({
        tone: "important",
        title: "High debt-to-income ratio",
        detail: `Recorded loan EMIs use ${Math.round(dti)}% of your monthly income. Review affordability before taking on more debt.`,
      });
    } else if (dti >= 30) {
      observations.push({
        tone: "warning",
        title: "Keep an eye on your EMI burden",
        detail: `Recorded loan EMIs use ${Math.round(dti)}% of your monthly income.`,
      });
    } else {
      observations.push({
        tone: "positive",
        title: "Manageable recorded EMI burden",
        detail: `Recorded loan EMIs use ${Math.round(dti)}% of your monthly income.`,
      });
    }

    if (loans.some((loan) => loan.missedPayments != null && loan.missedPayments > 0)) {
      observations.push({
        tone: "important",
        title: "Review reported missed payments",
        detail: "Your score uses the missed-payment counts you entered for your loans.",
      });
    }
    if (outstanding > 0 && loans.length) {
      observations.push({
        tone: "positive",
        title: "Outstanding debt is being tracked",
        detail: `${loans.length} active loan${loans.length === 1 ? "" : "s"} with outstanding balances are included in your analysis.`,
      });
    }
    return observations;
  }

  async report(userId: string) {
    const [dashboard, scenarios] = await Promise.all([
      this.dashboard(userId),
      prisma.loanScenario.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);
    return { ...dashboard, scenarios };
  }
}
