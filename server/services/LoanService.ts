import { prisma } from "../prisma.js";
import { AppError } from "../errors.js";
import { ScoreService } from "./ScoreService.js";
import type { LoanInput } from "../validation.js";

export class LoanService {
  private readonly scores = new ScoreService();

  async list(userId: string) {
    return prisma.loan.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { startDate: "desc" }] });
  }

  async get(userId: string, id: string) {
    const loan = await prisma.loan.findFirst({ where: { id, userId } });
    if (!loan) throw new AppError("Loan not found.", 404);
    return loan;
  }

  async create(userId: string, input: LoanInput) {
    const loan = await prisma.loan.create({
      data: { ...input, userId, startDate: new Date(`${input.startDate}T00:00:00.000Z`) },
    });
    await this.scores.recalculateIfReady(userId);
    return loan;
  }

  async update(userId: string, id: string, input: LoanInput) {
    await this.get(userId, id);
    const loan = await prisma.loan.update({
      where: { id },
      data: { ...input, startDate: new Date(`${input.startDate}T00:00:00.000Z`) },
    });
    await this.scores.recalculateIfReady(userId);
    return loan;
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.loan.delete({ where: { id } });
    await this.scores.recalculateIfReady(userId);
  }
}
