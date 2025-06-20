import User from '../models/user.model.js'
import bcrypt from 'bcrypt'
import { createAccessToken } from '../libs/jwt.js'
import config from '../config.js'
import jwt from 'jsonwebtoken'

export const register = async (req, res, next) => {
  const { username, email, password } = req.body

  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters long' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const user = new User({
      username,
      email,
      passwordHash
    })

    const savedUser = await user.save()

    const token = await createAccessToken({ id: savedUser._id, username: savedUser.username })

    res.cookie('token', token, {
      sameSite: 'none',
      secure: true
    })

    res.status(201).json(savedUser)
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  const { email, password } = req.body

  try {
    const userFound = await User.findOne({ email })

    const passwordCorrect = userFound === null ? false : await bcrypt.compare(password, userFound.passwordHash)

    if (!(userFound && passwordCorrect)) {
      return res.status(401).json({ error: 'invalid email or password' })
    }

    const token = await createAccessToken({ id: userFound._id, username: userFound.username })

    res.cookie('token', token, {
      sameSite: 'none',
      secure: true
    })

    res.status(200).json(userFound)
  } catch (error) {
    next(error)
  }
}

export const logout = (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0)
  })
  res.status(200).end()
}

export const verifyToken = async (req, res, next) => {
  const token = req.token

  try {
    if (!token) return res.status(401).end()

    const decodedUser = jwt.verify(token, config.SECRET)

    const userFound = await User.findById(decodedUser.id)

    if (!userFound) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const newToken = await createAccessToken({ id: userFound._id, username: userFound.username })

    res.cookie('token', newToken, {
      sameSite: 'none',
      secure: true
    })
    res.status(200).json(userFound)
  } catch (error) {
    next(error)
  }
}
