import { z } from "zod"

export const loginSchema = z.object({
  phone: z.string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .regex(/^[0-9]+$/, { message: "Invalid Phone Number" }),
  password: z.string().min(6, { message: "Password too short" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>



// Define your password recovery schema
export const recoverPasswordSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  email: z.string().email().optional().or(z.literal('')),
  name: z.string().min(1, { message: "Name is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type recoverPasswordValues = z.infer<typeof recoverPasswordSchema>