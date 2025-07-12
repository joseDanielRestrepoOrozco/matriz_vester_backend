import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3000

const DB_NAME =
  process.env.NODE_ENV === 'test'
    ? process.env.DB_NAME_TEST
    : process.env.DB_NAME

const MONGODB_URI = process.env.MONGODB_URI

const SECRET = process.env.SECRET

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const EMAIL_SERVICE = process.env.EMAIL_SERVICE

const EMAIL_USER = process.env.EMAIL_USER

const EMAIL_PASS = process.env.EMAIL_PASS

export default { DB_NAME, MONGODB_URI, PORT, SECRET, FRONTEND_URL, EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS }
