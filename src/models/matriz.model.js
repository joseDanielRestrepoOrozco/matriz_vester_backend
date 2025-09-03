import mongoose from 'mongoose'

const problemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  orderNumber: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  _id: true
})

const schema = new mongoose.Schema({
  references: {
    type: [[Number]],
    required: true,
    validate: {
      validator: function(v) {
        // Validar que sea una matriz cuadrada
        if (!Array.isArray(v) || v.length === 0) return false
        const size = v.length
        return v.every(row => Array.isArray(row) && row.length === size)
      },
      message: 'Referencias debe ser una matriz cuadrada de números enteros'
    }
  },
  problems: {
    type: [problemSchema],
    required: true,
    validate: {
      validator: function(v) {
        // Validar que el número de problemas coincida con las dimensiones de la matriz
        return Array.isArray(v) && v.length === this.references.length
      },
      message: 'El número de problemas debe coincidir con las dimensiones de la matriz'
    }
  }
}, {
  timestamps: true
})

schema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
    
    // Transformar problemas embebidos
    if (returnedObject.problems) {
      returnedObject.problems = returnedObject.problems.map(problem => {
        const problemObj = problem.toObject ? problem.toObject() : problem
        problemObj.id = problemObj._id
        delete problemObj._id
        delete problemObj.__v
        return problemObj
      })
    }
  }
})

export default mongoose.model('Matriz', schema)
