import { Router } from 'express'
import User from '../models/user.js'
import bcrypt from 'bcrypt'

const userRouter = Router()

userRouter.get('/', async (req, res) => {
  const users = await User.find({})

  res.json(users)
})

userRouter.get('/:id', async (req, res) => {
  const id = req.params.id

  const user = await User.findById(id)

  if (user) {
    res.json(user)
  } else {
    res.status(404).end()
  }
})

userRouter.post('/', async (req, res) => {
  const { username, name, password } = req.body

  if (!password || password.length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters long' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash
  })

  const savedUser = await user.save()

  res.status(201).json(savedUser)
})

export default userRouter
