import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).trim(),
  email: z.string({ required_error: 'Email is required' }).trim().email({
    message: 'Invalid email format'
  }),
  password: z.string({ required_error: 'Password is required' })
    .trim()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(20, { message: 'Password must be at most 20 characters long' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must include a number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Password must include a special character' })
})

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().email({
    message: 'Invalid email format'
  }),
  password: z.string({ required_error: 'Password is required' })
    .trim()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(20, { message: 'Password must be at most 20 characters long' })
    .refine((val) => /[0-9]/.test(val), { message: 'Password must include a number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Password must include a special character' })
})
