import mongoose from 'mongoose'

// Schema para problemas embebidos en la matriz
const embeddedProblemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del problema es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción del problema es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  orderNumber: {
    type: Number,
    required: [true, 'El número de orden es requerido'],
    min: [0, 'El número de orden debe ser mayor o igual a 0']
  }
}, {
  timestamps: true,
  _id: true 
})

const embeddedMatrixSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la matriz es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  references: {
    type: [[Number]],
    required: [true, 'Las referencias son requeridas'],
    validate: [
      {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0
        },
        message: 'La matriz de referencias no puede estar vacía'
      },
      {
        validator: function(v) {
          if (!Array.isArray(v) || v.length === 0) return false
          const size = v.length
          return v.every(row => Array.isArray(row) && row.length === size)
        },
        message: 'Las referencias deben formar una matriz cuadrada'
      },
      {
        validator: function(v) {
          return v.every(row => 
            row.every(val => Number.isInteger(val) && val >= 0 && val <= 4)
          )
        },
        message: 'Todos los elementos deben ser números enteros entre 0 y 4'
      }
    ]
  },
  problems: {
    type: [embeddedProblemSchema],
    required: [true, 'Los problemas son requeridos'],
    validate: [
      {
        validator: function(v) {
          return Array.isArray(v) && 
                 this.references && 
                 v.length === this.references.length
        },
        message: 'El número de problemas debe coincidir con las dimensiones de la matriz'
      },
      {
        validator: function(v) {
          if (!Array.isArray(v)) return false
          const orderNumbers = v.map(p => p.orderNumber)
          const uniqueNumbers = new Set(orderNumbers)
          return uniqueNumbers.size === orderNumbers.length
        },
        message: 'Los números de orden de los problemas deben ser únicos'
      }
    ]
  },
  status: {
    type: String,
    enum: ['DRAFT', 'COMPLETED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true,
  _id: true
})

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El nombre de usuario no puede exceder 30 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  passwordHash: {
    type: String,
    required: [true, 'La contraseña es requerida']
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING', 'INACTIVE'],
    default: 'PENDING'
  },
  matrices: {
    type: [embeddedMatrixSchema],
    default: []
  }
}, {
  timestamps: true
})

// Método para obtener matrices activas
schema.methods.getActiveMatrices = function() {
  return this.matrices.filter(matrix => matrix.status !== 'ARCHIVED')
}

// Método para obtener una matriz por ID
schema.methods.getMatrixById = function(matrixId) {
  return this.matrices.id(matrixId)
}

// Método para agregar una nueva matriz
schema.methods.addMatrix = function(matrixData) {
  this.matrices.push(matrixData)
  return this.save()
}

// Transformación JSON para el frontend
schema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v

    // Eliminar campos sensibles
    delete returnedObject.passwordHash
    delete returnedObject.verificationCode
    delete returnedObject.verificationCodeExpires
    delete returnedObject.status

    // Transformar matrices embebidas
    if (returnedObject.matrices && Array.isArray(returnedObject.matrices)) {
      returnedObject.matrices = returnedObject.matrices.map(matriz => {
        const matrizObj = matriz.toObject ? matriz.toObject() : matriz
        matrizObj.id = matrizObj._id
        delete matrizObj._id
        delete matrizObj.__v
        
        // Transformar problemas embebidos dentro de cada matriz
        if (matrizObj.problems && Array.isArray(matrizObj.problems)) {
          matrizObj.problems = matrizObj.problems.map(problem => {
            const problemObj = problem.toObject ? problem.toObject() : problem
            problemObj.id = problemObj._id
            delete problemObj._id
            delete problemObj.__v
            return problemObj
          })
        }
        
        return matrizObj
      })
    }

    return returnedObject
  }
})

// Índices para optimizar consultas
schema.index({ email: 1 })
schema.index({ username: 1 })
schema.index({ 'matrices.status': 1 })
schema.index({ 'matrices.createdAt': -1 })

export default mongoose.model('User', schema)
