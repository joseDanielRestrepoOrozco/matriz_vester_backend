import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.PORT || 3000

const DB_NAME =
  process.env.NODE_ENV === 'test'
    ? process.env.DB_NAME_TEST
    : process.env.DB_NAME

const MONGODB_URI = process.env.MONGODB_URI

const SECRET = process.env.SECRET

export default { DB_NAME, MONGODB_URI, PORT, SECRET }
