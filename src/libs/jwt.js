import jwt from 'jsonwebtoken'
import config from '../config.js'

export const createAccessToken = (payload, options = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      config.SECRET,
      { expiresIn: options.expiresIn || '7d', ...options },
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}
