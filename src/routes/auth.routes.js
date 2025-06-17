import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controller.js'
import authRequired from '../middlewares/validateToken.js'

const router = Router()

router.post('/register', register)

router.post('/login', login)

router.post('/logout', logout)

router.get('/prueba', authRequired, (req, res) => {
  res.status(200).json({ message: 'This is a public route' })
})

export default router
