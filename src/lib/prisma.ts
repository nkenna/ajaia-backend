import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma";
import config from "../config/config";

const adapter = new PrismaPg({
    connectionString: config.databaseUrl,
    max: config.prisma.max,
    idleTimeoutMillis: config.prisma.idleTimeoutMillis,
    connectionTimeoutMillis: config.prisma.connectionTimeoutMillis,
});

const prisma = new PrismaClient({
    adapter,
    log: config.isProduction ? ["error"] : ["query", "error", "warn"],
});

export * from "../generated/prisma";
export { prisma, PrismaClient, Prisma };