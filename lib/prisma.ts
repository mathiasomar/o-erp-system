import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () =>
  new PrismaClient({
    adapter,
  });

const hasPrismaDelegates = (client?: PrismaClient) => {
  if (!client) return false;

  const prismaClient = client as unknown as {
    product?: unknown;
    category?: unknown;
    mpesaTransaction?: unknown;
  };

  return (
    typeof prismaClient.product !== "undefined" &&
    typeof prismaClient.category !== "undefined" &&
    typeof prismaClient.mpesaTransaction !== "undefined"
  );
};

let prisma: PrismaClient;

if (hasPrismaDelegates(globalForPrisma.prisma)) {
  prisma = globalForPrisma.prisma as PrismaClient;
} else {
  prisma = createPrismaClient();
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
