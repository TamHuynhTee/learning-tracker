import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "auth.invalidEmail"),
  password: z.string().min(1, "auth.passwordRequired"),
});

export const registerSchema = loginSchema
  .extend({
    password: z.string().min(8, "auth.shortPassword"),
    confirmation: z.string().min(1, "auth.confirmRequired"),
  })
  .refine((values) => !values.confirmation || values.confirmation === values.password, {
    path: ["confirmation"],
    message: "auth.passwordMismatch",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
