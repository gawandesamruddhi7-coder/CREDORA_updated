import type { RequestHandler } from "express";
import { AuthService } from "./services/AuthService.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const authService = new AuthService();

export const requireAuth: RequestHandler = (request, response, next) => {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("credora_session="));
  const rawToken = cookie?.slice("credora_session=".length).trim();
  const token = rawToken ? decodeURIComponent(rawToken) : "";

  if (!token) {
    response.status(401).json({ error: "Please log in to continue." });
    return;
  }

  try {
    request.userId = authService.verifyToken(token);
    next();
  } catch {
    response.status(401).json({ error: "Your session is invalid or has expired. Please log in again." });
  }
};

export function authenticatedUserId(request: Express.Request) {
  if (!request.userId) throw new Error("Protected route is missing its authenticated user.");
  return request.userId;
}
