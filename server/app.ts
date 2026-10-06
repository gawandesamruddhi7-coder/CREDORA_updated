import cors from "cors";
import express, { type ErrorRequestHandler, type Request, type RequestHandler, type Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import { prisma } from "./prisma.js";
import { requireAuth, authenticatedUserId } from "./authMiddleware.js";
import { AuthService } from "./services/AuthService.js";
import { CalculatorService } from "./services/CalculatorService.js";
import { LoanService } from "./services/LoanService.js";
import { ReportService } from "./services/ReportService.js";
import { ScoreService } from "./services/ScoreService.js";
import { TaxService } from "./services/TaxService.js";
import { UserService } from "./services/UserService.js";
import {
  expenseSchema,
  incomeSchema,
  loginSchema,
  loanSchema,
  onboardingSchema,
  profileSchema,
  scenarioSchema,
  signupSchema,
} from "./validation.js";

const app = express();
const auth = new AuthService();
const users = new UserService();
const loans = new LoanService();
const scores = new ScoreService();
const calculator = new CalculatorService();
const reports = new ReportService();
const taxes = new TaxService();
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "lax" as const,
  path: "/api",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError("This origin is not allowed by the API.", 403));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

const asyncRoute = (handler: (request: Request, response: Response) => Promise<unknown>): RequestHandler =>
  (request, response, next) => {
    void handler(request, response).catch(next);
  };

const protectedRoute = (
  handler: (request: Request, response: Response, userId: string) => Promise<unknown>,
): RequestHandler[] => [
  requireAuth,
  asyncRoute((request, response) => handler(request, response, authenticatedUserId(request))),
];

const setSession = (response: Response, userId: string) => {
  response.cookie("credora_session", auth.createToken(userId), cookieOptions);
};

const publicUser = (user: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  city: string | null;
  employmentType: string | null;
  dependents: number | null;
  createdAt: Date;
}) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  age: user.age,
  city: user.city,
  employmentType: user.employmentType,
  dependents: user.dependents,
  createdAt: user.createdAt,
});

app.get("/api/health", asyncRoute(async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      response.status(503).json({ status: "degraded", error: "Database unavailable." });
      return;
    }
    throw error;
  }
}));

app.post("/api/auth/signup", asyncRoute(async (request, response) => {
  const input = signupSchema.parse(request.body);
  const user = await auth.signup(input);
  setSession(response, user.id);
  response.status(201).json({ user: publicUser(user) });
}));

app.post("/api/auth/login", asyncRoute(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await auth.login(input);
  setSession(response, user.id);
  response.json({ user: publicUser(user) });
}));

app.post("/api/auth/logout", (_request, response) => {
  response.clearCookie("credora_session", { ...cookieOptions, maxAge: undefined });
  response.status(204).end();
});

app.get("/api/auth/me", ...protectedRoute(async (_request, response, userId) => {
  response.json({ user: await users.getProfile(userId) });
}));

app.get("/api/profile", ...protectedRoute(async (_request, response, userId) => {
  response.json(await users.getProfile(userId));
}));

app.put("/api/profile", ...protectedRoute(async (request, response, userId) => {
  response.json(await users.updateProfile(userId, profileSchema.parse(request.body)));
}));

app.delete("/api/profile", ...protectedRoute(async (_request, response, userId) => {
  await users.deleteAccount(userId);
  response.clearCookie("credora_session", { ...cookieOptions, maxAge: undefined });
  response.status(204).end();
}));

app.get("/api/income", ...protectedRoute(async (_request, response, userId) => {
  response.json(await users.getIncome(userId));
}));

app.put("/api/income", ...protectedRoute(async (request, response, userId) => {
  response.json(await users.updateIncome(userId, incomeSchema.parse(request.body)));
}));

app.get("/api/expenses", ...protectedRoute(async (_request, response, userId) => {
  response.json(await users.getExpenses(userId));
}));

app.put("/api/expenses", ...protectedRoute(async (request, response, userId) => {
  response.json(await users.updateExpenses(userId, expenseSchema.parse(request.body)));
}));

app.post("/api/onboarding", ...protectedRoute(async (request, response, userId) => {
  response.json(await users.saveOnboarding(userId, onboardingSchema.parse(request.body)));
}));

app.get("/api/loans", ...protectedRoute(async (_request, response, userId) => {
  response.json(await loans.list(userId));
}));

app.post("/api/loans", ...protectedRoute(async (request, response, userId) => {
  response.status(201).json(await loans.create(userId, loanSchema.parse(request.body)));
}));

app.get("/api/loans/:id", ...protectedRoute(async (request, response, userId) => {
  response.json(await loans.get(userId, request.params.id));
}));

app.put("/api/loans/:id", ...protectedRoute(async (request, response, userId) => {
  response.json(await loans.update(userId, request.params.id, loanSchema.parse(request.body)));
}));

app.delete("/api/loans/:id", ...protectedRoute(async (request, response, userId) => {
  await loans.delete(userId, request.params.id);
  response.status(204).end();
}));

app.get("/api/dashboard", ...protectedRoute(async (_request, response, userId) => {
  response.json(await reports.dashboard(userId));
}));

app.get("/api/score", ...protectedRoute(async (_request, response, userId) => {
  response.json(await scores.getLatest(userId));
}));

app.post("/api/score", ...protectedRoute(async (_request, response, userId) => {
  response.json(await scores.recalculateIfReady(userId));
}));

app.post("/api/calculator/calculate", ...protectedRoute(async (request, response, userId) => {
  const input = scenarioSchema.omit({ name: true }).parse(request.body);
  response.json(await calculator.calculate(userId, input));
}));

app.get("/api/scenarios", ...protectedRoute(async (_request, response, userId) => {
  response.json(await calculator.list(userId));
}));

app.post("/api/scenarios", ...protectedRoute(async (request, response, userId) => {
  response.status(201).json(await calculator.save(userId, scenarioSchema.parse(request.body)));
}));

app.delete("/api/scenarios/:id", ...protectedRoute(async (request, response, userId) => {
  await calculator.delete(userId, request.params.id);
  response.status(204).end();
}));

app.get("/api/reports", ...protectedRoute(async (_request, response, userId) => {
  response.json(await reports.report(userId));
}));

app.get("/api/tax", ...protectedRoute(async (_request, response, userId) => {
  response.json(await taxes.estimate(userId));
}));

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Please check the submitted information.",
      details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    });
    return;
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    response.status(409).json({ error: "This record conflicts with an existing account or record." });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    response.status(404).json({ error: "The requested record was not found." });
    return;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database connection failed. Check DATABASE_URL and PostgreSQL availability.");
  } else {
    console.error("Unhandled API error:", error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error");
  }
  response.status(500).json({ error: "Something went wrong. Please try again." });
};

app.use(errorHandler);

export default app;
