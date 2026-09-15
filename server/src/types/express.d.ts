import { PrismaClient } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userName?: string;
      prisma?: PrismaClient;
    }
  }
}

export {};