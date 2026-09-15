import { z } from "zod";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required").max(100),
  password: z.string().regex(passwordRegex, "Password must be at least 6 chars with letters and numbers"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;