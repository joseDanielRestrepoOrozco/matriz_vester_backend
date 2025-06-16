import { Router } from 'express'
import bcrypt from 'bcrypt'
import User from '../models/user.js'
import jwt from 'jsonwebtoken'
import config from '../utils/config.js'

const loginRouter = Router()

loginRouter.post('/', async (req, res) => {
  const { username, password } = req.body

  const user = await User.findOne({ username })
  const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: 'invalid username or password' })
  }

  const userForToken = {
    username: user.name,
    id: user._id
  }

  const token = jwt.sign(userForToken, config.SECRET, {
    expiresIn: 60 * 60
  })

  res.status(200).send({ token, username: user.name, name: user.name })
})

export default loginRouter
