import { z } from 'zod/v4'

const passwordSchema = z.string()
  .trim()
  .min(8, { error: 'Password must be at least 8 characters long' })
  .max(20, { error: 'Password must be at most 20 characters long' })
  .refine((val) => /[0-9]/.test(val), { error: 'Password must include a number' })
  .refine((val) => /[^A-Za-z0-9]/.test(val), { error: 'Password must include a special character' })

const emailSchema = z.email({
  error: 'Invalid email format'
})

export const registerSchema = z.object({
  username: z.string({ error: () => 'Username is required' }).trim(),
  email: emailSchema,
  password: passwordSchema
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export const verifyCodeSchema = z.object({
  code: z.string({ error: () => 'Code is required' })
    .trim()
    .length(6, {
      error: 'Incorrect code'
    }),
  email: emailSchema
})

export const verifyEmailSchema = z.object({
  email: emailSchema
})

export const changeResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordSchema,
  confirmNewPassword: passwordSchema
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  error: 'Las contraseñas no coinciden'
})
