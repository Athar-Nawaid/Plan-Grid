import { NextFunction, Request, Response } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token) as JwtPayload;
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userName = payload.name;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}