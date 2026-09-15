import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema } from "../utils/validation";
import { prisma } from "../config/prisma";
import { signToken } from "../utils/jwt";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, name, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
  });
});