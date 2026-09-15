import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/prisma";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a search query (?q=email)" });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: parsed.data.q, mode: "insensitive" } },
        { name: { contains: parsed.data.q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, avatar: true },
    take: 10,
  });

  res.json(users);
});