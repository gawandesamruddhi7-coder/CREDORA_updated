import { z } from "zod";

const nonnegative = z.number().finite().min(0);
const positive = z.number().finite().positive();
const optionalText = z.string().trim().max(120).nullable().optional();

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128),
  phone: z.string().trim().max(32).optional().default(""),
  employmentType: z.string().trim().max(64).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(32).nullable().optional(),
  age: z.number().int().min(13).max(120).nullable().optional(),
  city: optionalText,
  employmentType: optionalText,
  dependents: z.number().int().min(0).max(30).nullable().optional(),
});

export const incomeSchema = z.object({
  monthlyIncome: nonnegative,
  otherMonthlyIncome: nonnegative,
  annualIncome: nonnegative,
});

export const expenseSchema = z.object({
  rent: nonnegative,
  utilities: nonnegative,
  food: nonnegative,
  transportation: nonnegative,
  insurance: nonnegative,
  otherExpenses: nonnegative,
});

export const loanSchema = z.object({
  loanType: z.string().trim().min(1).max(64),
  loanName: z.string().trim().min(1).max(120),
  principalAmount: positive,
  outstandingAmount: nonnegative,
  interestRate: nonnegative.max(100),
  originalTenureMonths: z.number().int().positive().max(1200),
  remainingTenureMonths: z.number().int().min(0).max(1200),
  monthlyEmi: nonnegative,
  startDate: z.string().date(),
  status: z.enum(["ACTIVE", "CLOSED"]).optional().default("ACTIVE"),
  missedPayments: z.number().int().min(0).max(1000).nullable().optional(),
});

export const onboardingSchema = z.object({
  profile: z.object({
    age: z.number().int().min(13).max(120).nullable().optional(),
    city: optionalText,
    employmentType: optionalText,
    dependents: z.number().int().min(0).max(30).nullable().optional(),
  }),
  income: incomeSchema,
  expenses: expenseSchema,
  loans: z.array(loanSchema).max(50),
});

export const scenarioSchema = z.object({
  name: z.string().trim().min(1).max(80),
  loanType: z.string().trim().min(1).max(64),
  loanAmount: positive,
  interestRate: nonnegative.max(100),
  tenureMonths: z.number().int().positive().max(1200),
  processingFee: nonnegative,
});

export type LoanInput = z.infer<typeof loanSchema>;
export type ScenarioInput = z.infer<typeof scenarioSchema>;
