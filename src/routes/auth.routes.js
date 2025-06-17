import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controller.js'
import authRequired from '../middlewares/validateToken.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import validateSchema from '../middlewares/validator.middleware.js'

const router = Router()

router.post('/register', validateSchema(registerSchema), register)

router.post('/login', validateSchema(loginSchema), login)

router.post('/logout', logout)

router.get('/prueba', authRequired, (req, res) => {
  res.status(200).json({ message: 'This is a public route' })
})

export default router
