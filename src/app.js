import express from 'express'
import cors from 'cors'
import config from './utils/config.js'
import mongoose from 'mongoose'
import userRouter from './controllers/users.js'
import middleware from './utils/middleware.js'
import loginRouter from './controllers/login.js'

const app = express()

mongoose.set('strictQuery', false)

mongoose
  .connect(config.MONGODB_URI, {
    dbName: config.DB_NAME
  })
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())
app.use(middleware.tokenExtractor)

app.use('/api/users', userRouter)
app.use('/api/login', loginRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app
