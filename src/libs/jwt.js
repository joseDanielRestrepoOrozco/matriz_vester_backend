import jwt from 'jsonwebtoken'
import config from '../config.js'

export const createAccessToken = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload,
      config.SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}
