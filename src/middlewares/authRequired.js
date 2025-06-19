import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import config from '../config.js'

const authRequired = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.token, config.SECRET)

    if (!decoded.id) {
      return res.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(400).json({ error: 'invalid user id' })
    }

    req.user = user

    next()
  } catch (error) {
    next(error)
  }
}

export default authRequired
