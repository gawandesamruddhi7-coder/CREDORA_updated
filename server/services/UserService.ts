import { prisma } from "../prisma.js";
import { AppError } from "../errors.js";
import type { z } from "zod";
import type { expenseSchema, incomeSchema, onboardingSchema, profileSchema } from "../validation.js";
import { ScoreService } from "./ScoreService.js";

type ProfileInput = z.infer<typeof profileSchema>;
type IncomeInput = z.infer<typeof incomeSchema>;
type ExpenseInput = z.infer<typeof expenseSchema>;
type OnboardingInput = z.infer<typeof onboardingSchema>;

export class UserService {
  private readonly scores = new ScoreService();

  async getProfile(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true, fullName: true, email: true, phone: true, age: true,
        city: true, employmentType: true, dependents: true, createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: ProfileInput) {
    const duplicate = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (duplicate) throw new AppError("An account with this email already exists.", 409);
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, fullName: true, email: true, phone: true, age: true,
        city: true, employmentType: true, dependents: true, createdAt: true,
      },
    });
  }

  async updateIncome(userId: string, data: IncomeInput) {
    const result = await prisma.income.upsert({ where: { userId }, create: { ...data, userId }, update: data });
    await this.scores.recalculateIfReady(userId);
    return result;
  }

  async getIncome(userId: string) {
    return prisma.income.findUnique({ where: { userId } });
  }

  async updateExpenses(userId: string, data: ExpenseInput) {
    const result = await prisma.expense.upsert({ where: { userId }, create: { ...data, userId }, update: data });
    await this.scores.recalculateIfReady(userId);
    return result;
  }

  async getExpenses(userId: string) {
    return prisma.expense.findUnique({ where: { userId } });
  }

  async saveOnboarding(userId: string, input: OnboardingInput) {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: input.profile });
      await transaction.income.upsert({
        where: { userId },
        create: { ...input.income, userId },
        update: input.income,
      });
      await transaction.expense.upsert({
        where: { userId },
        create: { ...input.expenses, userId },
        update: input.expenses,
      });
      await transaction.loan.deleteMany({ where: { userId } });
      if (input.loans.length) {
        await transaction.loan.createMany({
          data: input.loans.map((loan) => ({
            ...loan,
            userId,
            startDate: new Date(`${loan.startDate}T00:00:00.000Z`),
          })),
        });
      }
    });
    const score = await this.scores.recalculateIfReady(userId);
    return { profile: await this.getProfile(userId), score };
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
  }
}
