import mongoose from 'mongoose'
import config from './config.js'

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false)

    await mongoose.connect(config.MONGODB_URI, { dbName: config.DB_NAME })
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message)

    process.exit(1)
  }
}
