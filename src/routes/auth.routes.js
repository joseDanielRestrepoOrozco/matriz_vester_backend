import { Router } from 'express'
import { register, login, logout, verifyToken } from '../controllers/auth.controller.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import validateSchema from '../middlewares/validator.middleware.js'

const router = Router()

router.post('/register', validateSchema(registerSchema), register)

router.post('/login', validateSchema(loginSchema), login)

router.post('/logout', logout)

router.get('/verify', verifyToken)

export default router
