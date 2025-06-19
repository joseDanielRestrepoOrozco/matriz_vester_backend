import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controller.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import validateSchema from '../middlewares/validator.middleware.js'
import authRequired from '../middlewares/authRequired.js'

const router = Router()

router.post('/register', validateSchema(registerSchema), register)

router.post('/login', validateSchema(loginSchema), login)

router.post('/logout', logout)

router.get('/prueba', authRequired, (req, res) => {
  res.status(200).json({ message: 'Auth route is working' })
})

export default router
