import { Router } from 'express'
import { register, login, logout, verifyToken, verifyCode, secondFactorAuthentication, resetPassword, changeResetPassword } from '../controllers/auth.controller.js'
import { registerSchema, loginSchema, verifyCodeSchema, verifyEmailSchema } from '../schemas/auth.schema.js'
import validateSchema from '../middlewares/validator.middleware.js'

const router = Router()

router.post('/register', validateSchema(registerSchema), register)

router.post('/login', validateSchema(loginSchema), login)

router.post('/logout', logout)

router.post('/verify', verifyToken)

router.post('/verifyCode', validateSchema(verifyCodeSchema), verifyCode)

router.post('/secondFactorAuthentication', validateSchema(verifyCodeSchema), secondFactorAuthentication)

router.post('/resetPassword', validateSchema(verifyEmailSchema), resetPassword)

router.put('/changeResetPassword', validateSchema(), changeResetPassword)

export default router
