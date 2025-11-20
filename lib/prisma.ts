// Import über require, um CJS/ESM-Interop-Probleme in Next.js Server-Bundles zu vermeiden
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (...args: any[]) => any;
};

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

function getPrismaClient(): PrismaClientType {
  // Check if existing client has the new model and fields
  if (globalForPrisma.prisma) {
    try {
      // Try to access the outreachPlace model
      const hasOutreachPlace = typeof (globalForPrisma.prisma as any).outreachPlace !== 'undefined';
      // Check if inquiry model has the new replySentAt and replyTemplate fields
      // We check by trying to access the model's update method signature
      const inquiryModel = (globalForPrisma.prisma as any).inquiry;
      const hasNewFields = inquiryModel && typeof inquiryModel.update === 'function';
      // Check if subscription model exists
      const hasSubscription = typeof (globalForPrisma.prisma as any).subscription !== 'undefined';
      
      if (!hasOutreachPlace || !hasNewFields || !hasSubscription) {
        console.log("Prisma Client missing models or fields, creating new instance...");
        // Disconnect existing client (fire and forget)
        if (typeof (globalForPrisma.prisma as any).$disconnect === 'function') {
          (globalForPrisma.prisma as any).$disconnect().catch(() => {});
        }
        // Clear global instance
        delete (globalThis as any).prisma;
        globalForPrisma.prisma = undefined;
      }
    } catch (e) {
      // If check fails, assume we need to reload
      console.log("Prisma Client check failed, creating new instance...");
      try {
        if (typeof (globalForPrisma.prisma as any).$disconnect === 'function') {
          (globalForPrisma.prisma as any).$disconnect().catch(() => {});
        }
      } catch {}
      delete (globalThis as any).prisma;
      globalForPrisma.prisma = undefined;
    }
  }

  // Create new client if needed
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

