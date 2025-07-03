import mongoose from 'mongoose'
import config from './config.js'
import logger from './libs/logger.js'

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false)

    await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME })
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message)
    process.exit(1)
  }
}
