import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import { createAccessToken } from '../libs/jwt.js'
import config from '../config.js'
import jwt from 'jsonwebtoken'
import { generateVerificationCode, sendEmail, sendPassVerificationEmail } from '../libs/email.js'

export const register = async (req, res, next) => {
  const { username, email, password } = req.body

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const verificationCode = await generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000)

    const user = new User({
      username,
      email,
      passwordHash,
      verificationCode,
      verificationCodeExpires
    })

    const savedUser = await user.save()

    // Enviar email con el código de verificación
    await sendEmail(email, verificationCode, username, 'verification')

    res.status(201).json(savedUser)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })

    const validPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false

    if (!validPassword) {
      return res.status(400).json({ message: 'user or password incorrect' })
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account not verified' })
    }

    // Generar código y expiración
    const newCode = await generateVerificationCode()
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000)
    user.verificationCode = newCode
    user.verificationCodeExpires = expirationTime
    await user.save()
    // Solo email
    const emailSent = await sendEmail(email, newCode, user.username, 'authentication')
    if (emailSent) {
      return res.status(200).json(user)
    } else {
      return res.status(500).json({ message: 'Error sending email' })
    }
  } catch (error) {
    next(error)
  }
}

export const logout = (req, res) => {
  res.status(200).end()
}

export const verifyToken = async (req, res, next) => {
  const token = req.body.token

  try {
    if (!token) return res.status(401).end()
    const decodedUser = jwt.verify(token, config.SECRET)
    const user = await User.findById(decodedUser.id)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const newToken = await createAccessToken({ id: user._id })

    res.status(200).json({ user, token: newToken })
  } catch (error) {
    next(error)
  }
}

export const verifyCode = async (req, res, next) => {
  const { email, code } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: 'user not found' })
    }
    if (user.status === 'ACTIVE') {
      return res.status(400).json({ error: 'account already verified' })
    }
    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ error: 'there is not registered verification code' })
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'wrong code' })
    }
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ error: 'code has expired' })
    }
    user.status = 'ACTIVE'
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save()
    // Firmar el token aquí
    const token = await createAccessToken({ id: user._id })
    res.status(200).json({ message: 'verification successful', token })
  } catch (error) {
    next(error)
  }
}

export const secondFactorAuthentication = async (req, res) => {
  const { code, email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const now = new Date()
    if (!user.verificationCodeExpires || now > user.verificationCodeExpires) {
      return res.status(400).json({
        message: 'Authentication code has expired.'
      })
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({
        message: 'Invalid authentication code'
      })
    }
    // Generar token de autenticación solo con la id
    const token = await createAccessToken({ id: user._id })
    res.status(200).json({
      message: 'Login successfull',
      token
    })
  } catch (error) {
    res.status(500).json({
      message: 'Authentication failed', error: error.message
    })
  }
}

export const resetPassword = async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })
  if (!user) return res.status(404).json({ message: 'User not found' })
  // Token solo válido por 1 horas
  const token = await createAccessToken({ userId: user._id }, { expiresIn: '1h' })
  const resetLink = `${config.FRONTEND_URL}/changeResetPassword/${token}`
  try {
    await sendPassVerificationEmail(user.email, resetLink, user.username)
    res.status(200).json({ message: 'Reset email sent' })
  } catch (error) {
    console.log('Error sending link:', error)
    res.status(500).json({ message: 'Failed to send verification link', error: error.message })
  }
}

export const changeResetPassword = async (req, res) => {
  const { token, newPassword, confirmNewPassword } = req.body

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "The new password don't match" })
  }
  try {
    // Decodifica el token usando jwt.verify directamente, no verifyToken middleware
    const decoded = jwt.verify(token, config.SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const password = await bcrypt.hash(newPassword, 10)
    user.passwordHash = password
    await user.save()
    res.status(200).json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' })
  }
}
