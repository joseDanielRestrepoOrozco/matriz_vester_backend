import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import config from '../config.js'

const authRequired = async (req, res, next) => {
  const decoded = jwt.verify(req.token, config.SECRET)

  console.log('Decoded token:', decoded)

  if (!decoded.id) {
    return res.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decoded.id)

  if (!user) {
    return res.status(400).json({ error: 'invalid user id' })
  }

  req.user = user

  next()
}

export default authRequired
