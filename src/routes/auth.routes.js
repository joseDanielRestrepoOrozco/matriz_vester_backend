import { Router } from 'express'
import { register, login, logout, verifyToken, verifyCode, secondFactorAuthentication, resetPassword, changeResetPassword } from '../controllers/auth.controller.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import validateSchema from '../middlewares/validator.middleware.js'

const router = Router()

router.post('/register', validateSchema(registerSchema), register)

router.post('/login', validateSchema(loginSchema), login)

router.post('/logout', logout)

router.get('/verify', verifyToken)

router.post('/verifyCode', verifyCode)

router.post('/secondFactorAuthentication', secondFactorAuthentication)

router.post('/resetPassword', resetPassword)

router.put('/changeResetPassword', changeResetPassword)

export default router
