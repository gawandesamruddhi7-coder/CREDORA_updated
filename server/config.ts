import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
const port = Number(process.env.PORT ?? 3001);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.");
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port number.");
}

export const config = {
  port,
  jwtSecret,
  isProduction: process.env.NODE_ENV === "production",
  corsOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173,http://localhost:8443,http://localhost:8444")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
