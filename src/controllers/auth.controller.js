import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import { createAccessToken } from '../libs/jwt.js'

export const register = async (req, res) => {
  const { username, email, password } = req.body

  const passwordHash = await bcrypt.hash(password, 10)

  const user = new User({
    username,
    email,
    passwordHash
  })

  const savedUser = await user.save()

  const token = await createAccessToken({ id: savedUser._id, username: savedUser.username })

  res.cookie('token', token)

  res.status(201).json(savedUser)
}

export const login = async (req, res) => {
  const { email, password } = req.body

  const userFound = await User.findOne({ email })

  const passwordCorrect = userFound === null ? false : await bcrypt.compare(password, userFound.passwordHash)

  if (!(userFound && passwordCorrect)) {
    return res.status(401).json({ error: 'invalid email or password' })
  }

  const token = await createAccessToken({ id: userFound._id, username: userFound.username })

  res.cookie('token', token)

  res.status(200).json(userFound)
}

export const logout = (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0)
  })
  res.status(200).end()
}
