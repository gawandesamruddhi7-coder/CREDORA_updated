import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../errors.js";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import type { z } from "zod";
import type { loginSchema, signupSchema } from "../validation.js";

type SignupInput = z.infer<typeof signupSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  async signup(input: SignupInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        employmentType: input.employmentType || null,
        passwordHash,
      },
    });
    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError("Email or password is incorrect.", 401);
    }
    return user;
  }

  createToken(userId: string) {
    return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "30d" });
  }

  verifyToken(token: string) {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new AppError("Invalid authentication token.", 401);
    }
    return payload.sub;
  }
}
