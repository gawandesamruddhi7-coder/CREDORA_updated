import app from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

const server = app.listen(config.port, () => {
  console.info(`Credora API listening on http://localhost:${config.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
