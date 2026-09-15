import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { Role } from "@prisma/client";

function isRoleOrHigher(userRole: Role | undefined, required: Role): boolean {
  if (!userRole) return false;
  const order: Record<Role, number> = { VIEWER: 1, MEMBER: 2, ADMIN: 3 };
  return order[userRole] >= order[required];
}

export async function requireProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.userId;
  if (!projectId || !userId) {
    res.status(400).json({ error: "projectId and auth required" });
    return;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!membership) {
    res.status(403).json({ error: "You are not a member of this project" });
    return;
  }

  (req as Request & { membershipRole?: Role }).membershipRole = membership.role;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as Request & { membershipRole?: Role }).membershipRole;
    if (!isRoleOrHigher(userRole, role)) {
      res.status(403).json({ error: `Requires ${role} role or higher` });
      return;
    }
    next();
  };
}