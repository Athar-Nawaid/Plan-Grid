import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
  };
  return jwt.sign(payload, SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}