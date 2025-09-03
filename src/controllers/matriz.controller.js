import User from '../models/user.model.js'
import logger from '../libs/logger.js'

// Crear una nueva matriz para el usuario
export const createMatrix = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { name, description, references, problems } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Validar que hay al menos 2 problemas
    if (!problems || problems.length < 2) {
      return res.status(400).json({ 
        message: 'La matriz debe tener al menos 2 problemas' 
      })
    }

    // Validar que no hay más de 12 problemas
    if (problems.length > 12) {
      return res.status(400).json({ 
        message: 'La matriz no puede tener más de 12 problemas' 
      })
    }

    // Validar que todos los problemas tienen nombre y descripción
    const invalidProblems = problems.filter(p => !p.name || !p.name.trim() || !p.description || !p.description.trim())
    if (invalidProblems.length > 0) {
      return res.status(400).json({ 
        message: 'Todos los problemas deben tener nombre y descripción' 
      })
    }

    // Crear nueva matriz
    const newMatrix = {
      name,
      description,
      references,
      problems,
      status: 'DRAFT'
    }

    // Agregar la matriz al usuario
    user.matrices.push(newMatrix)
    await user.save()

    // Obtener la matriz recién creada
    const createdMatrix = user.matrices[user.matrices.length - 1]

    logger.info(`Nueva matriz creada para usuario ${userId}`)
    res.status(201).json({
      message: 'Matriz creada correctamente',
      matrix: createdMatrix
    })

  } catch (error) {
    logger.error('Error al crear matriz:', error)
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: 'Errores de validación',
        errores
      })
    }

    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtener todas las matrices del usuario
export const getMatrices = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { status } = req.query

    const user = await User.findById(userId).select('matrices')
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    let matrices = user.matrices || []

    // Filtrar por estado si se especifica
    if (status) {
      matrices = matrices.filter(matrix => matrix.status === status)
    }

    res.json({
      matrices,
      total: matrices.length
    })

  } catch (error) {
    logger.error('Error al obtener matrices:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtener información básica de matrices para el sidebar (tipo chat)
export const getMatricesBasics = async (req, res) => {
  try {
    const { id: userId } = req.user

    const user = await User.findById(userId).select('matrices')
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Filtrar matrices válidas y agregar logs para depuración
    logger.info(`Usuario ${userId} tiene ${user.matrices.length} matrices`)
    
    // Primero, log de todas las matrices para depuración
    user.matrices.forEach((matrix, index) => {
      logger.info(`Matriz ${index}: ${JSON.stringify({
        _id: matrix._id,
        name: matrix.name,
        hasId: !!matrix._id,
        idType: typeof matrix._id
      })}`)
    })
    
    const validMatrices = user.matrices.filter(matrix => {
      const isValid = matrix && matrix._id && matrix.name;
      if (!isValid) {
        logger.warn(`Matriz inválida encontrada: ${JSON.stringify({
          hasMatrix: !!matrix,
          hasId: matrix ? !!matrix._id : false,
          hasName: matrix ? !!matrix.name : false,
          matrix: matrix ? { _id: matrix._id, name: matrix.name } : null
        })}`)
        return false
      }
      return true
    })

    logger.info(`${validMatrices.length} matrices válidas después del filtrado`)

    // Formatear las matrices para el sidebar tipo chat
    const matricesBasics = validMatrices.map(matrix => {
      const matrixId = matrix._id.toString();
      logger.info(`Formateando matriz: ${matrix.name} con ID: ${matrixId}`)
      return {
        id: matrixId, // Asegurar que se convierta a string
        name: matrix.name,
        description: matrix.description,
        status: matrix.status,
        createdAt: matrix.createdAt,
        updatedAt: matrix.updatedAt,
        problemsCount: matrix.problems ? matrix.problems.length : 0,
        lastActivity: matrix.updatedAt || matrix.createdAt,
        // Indicador visual para el estado
        statusIcon: getStatusIcon(matrix.status),
        // Preview del primer problema si existe
        firstProblem: matrix.problems && matrix.problems.length > 0 
          ? matrix.problems[0].name 
          : 'Sin problemas definidos'
      }
    }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)) // Ordenar por actividad más reciente

    logger.info(`Enviando ${matricesBasics.length} matrices al frontend`)
    matricesBasics.forEach(matrix => {
      logger.info(`- ${matrix.name} (ID: ${matrix.id})`)
    })

    res.json({
      matrices: matricesBasics,
      total: matricesBasics.length,
      summary: {
        active: matricesBasics.filter(m => m.status !== 'ARCHIVED').length,
        completed: matricesBasics.filter(m => m.status === 'COMPLETED').length,
        drafts: matricesBasics.filter(m => m.status === 'DRAFT').length
      }
    })

  } catch (error) {
    logger.error('Error al obtener matrices básicas:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Función auxiliar para obtener iconos de estado
const getStatusIcon = (status) => {
  const icons = {
    'DRAFT': '📝',
    'COMPLETED': '✅', 
    'ARCHIVED': '📦'
  }
  return icons[status] || '❓'
}

// Endpoint temporal para crear matrices de ejemplo (solo para testing)
export const createSampleMatrices = async (req, res) => {
  try {
    const { id: userId } = req.user

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Limpiar matrices existentes para evitar duplicados en testing
    user.matrices = []

    // Crear matrices de ejemplo
    const sampleMatrices = [
      {
        name: "Análisis de Problemas Urbanos",
        description: "Matriz para analizar los principales problemas de la ciudad",
        references: [
          [0, 2, 1, 3],
          [1, 0, 2, 1],
          [3, 2, 0, 2],
          [2, 1, 3, 0]
        ],
        problems: [
          { name: "Tráfico vehicular", description: "Congestión en horas pico", orderNumber: 0 },
          { name: "Contaminación del aire", description: "Emisiones de vehículos e industrias", orderNumber: 1 },
          { name: "Falta de espacios verdes", description: "Pocas áreas recreativas", orderNumber: 2 },
          { name: "Sistema de transporte público", description: "Ineficiencia del transporte público", orderNumber: 3 }
        ],
        status: 'COMPLETED'
      },
      {
        name: "Problemas Empresariales",
        description: "Análisis de factores que afectan la productividad",
        references: [
          [0, 1, 2],
          [2, 0, 1],
          [1, 2, 0]
        ],
        problems: [
          { name: "Rotación de personal", description: "Alta rotación en el equipo", orderNumber: 0 },
          { name: "Falta de capacitación", description: "Personal no capacitado adecuadamente", orderNumber: 1 },
          { name: "Comunicación interna", description: "Problemas de comunicación entre departamentos", orderNumber: 2 }
        ],
        status: 'DRAFT'
      },
      {
        name: "Análisis Educativo",
        description: "Factores que afectan el rendimiento académico",
        references: [
          [0, 3, 2, 1, 2],
          [2, 0, 1, 3, 1],
          [1, 2, 0, 2, 3],
          [3, 1, 1, 0, 2],
          [2, 2, 1, 1, 0]
        ],
        problems: [
          { name: "Ausentismo estudiantil", description: "Estudiantes que faltan frecuentemente", orderNumber: 0 },
          { name: "Falta de recursos didácticos", description: "Material insuficiente para enseñanza", orderNumber: 1 },
          { name: "Infraestructura deficiente", description: "Aulas en mal estado", orderNumber: 2 },
          { name: "Desmotivación docente", description: "Profesores con baja motivación", orderNumber: 3 },
          { name: "Apoyo familiar limitado", description: "Falta de apoyo de los padres", orderNumber: 4 }
        ],
        status: 'DRAFT'
      }
    ]

    // Agregar las matrices al usuario
    user.matrices.push(...sampleMatrices)
    await user.save()

    logger.info(`Matrices de ejemplo creadas para usuario ${userId}`)
    res.status(201).json({
      message: 'Matrices de ejemplo creadas correctamente',
      count: sampleMatrices.length
    })

  } catch (error) {
    logger.error('Error al crear matrices de ejemplo:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtener una matriz específica por ID
export const getMatrixById = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { matrixId } = req.params

    const user = await User.findById(userId).select('matrices')
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const matrix = user.matrices.id(matrixId)
    
    if (!matrix) {
      return res.status(404).json({ message: 'Matriz no encontrada' })
    }

    res.json({ matrix })

  } catch (error) {
    logger.error('Error al obtener matriz:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Actualizar una matriz existente
export const updateMatrix = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { matrixId } = req.params
    const updates = req.body

    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const matrix = user.matrices.id(matrixId)
    
    if (!matrix) {
      return res.status(404).json({ message: 'Matriz no encontrada' })
    }

    // Actualizar campos permitidos
    const allowedFields = ['name', 'description', 'references', 'problems', 'status']
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        matrix[field] = updates[field]
      }
    })

    // Validar que hay al menos 2 problemas
    if (matrix.problems && matrix.problems.length < 2) {
      return res.status(400).json({ 
        message: 'La matriz debe tener al menos 2 problemas' 
      })
    }

    // Validar que no hay más de 12 problemas
    if (matrix.problems && matrix.problems.length > 12) {
      return res.status(400).json({ 
        message: 'La matriz no puede tener más de 12 problemas' 
      })
    }

    // Si se actualizaron los problemas, ajustar la matriz de referencias si es necesario
    if (updates.problems && updates.references) {
      const problemCount = matrix.problems.length
      const references = updates.references
      
      // Verificar que la matriz de referencias tenga el tamaño correcto
      if (references.length !== problemCount || 
          references.some(row => row.length !== problemCount)) {
        // Ajustar la matriz de referencias al nuevo tamaño
        const newReferences = Array(problemCount).fill(null).map((_, i) => 
          Array(problemCount).fill(null).map((_, j) => {
            if (i === j) return 0 // Diagonal siempre es 0
            if (references[i] && references[i][j] !== undefined) {
              return references[i][j]
            }
            return 0
          })
        )
        matrix.references = newReferences
      }
    }

    // Si se completa la matriz, establecer fecha de completado
    if (updates.status === 'COMPLETED') {
      matrix.completedDate = new Date()
    }

    await user.save()

    logger.info(`Matriz ${matrixId} actualizada para usuario ${userId}`)
    res.json({
      message: 'Matriz actualizada correctamente',
      matrix: matrix
    })

  } catch (error) {
    logger.error('Error al actualizar matriz:', error)
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: 'Errores de validación',
        errores
      })
    }

    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Eliminar una matriz específica
export const deleteMatrix = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { matrixId } = req.params

    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const matrix = user.matrices.id(matrixId)
    
    if (!matrix) {
      return res.status(404).json({ message: 'Matriz no encontrada' })
    }

    // Remover la matriz del array usando pull()
    user.matrices.pull(matrixId)
    await user.save()

    logger.info(`Matriz ${matrixId} eliminada para usuario ${userId}`)
    res.json({
      message: 'Matriz eliminada correctamente'
    })

  } catch (error) {
    logger.error('Error al eliminar matriz:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Actualizar un problema específico dentro de una matriz
export const updateProblem = async (req, res) => {
  try {
    const { id: userId } = req.user
    const { matrixId, problemId } = req.params
    const { name, description, orderNumber } = req.body

    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const matrix = user.matrices.id(matrixId)
    
    if (!matrix) {
      return res.status(404).json({ message: 'Matriz no encontrada' })
    }

    const problem = matrix.problems.id(problemId)
    
    if (!problem) {
      return res.status(404).json({ message: 'Problema no encontrado' })
    }

    // Actualizar campos si se proporcionan
    if (name !== undefined) problem.name = name
    if (description !== undefined) problem.description = description
    if (orderNumber !== undefined) {
      // Validar que el número de orden no esté duplicado
      const otherProblems = matrix.problems.filter(p => p._id.toString() !== problemId)
      const existingNumbers = otherProblems.map(p => p.orderNumber)
      
      if (existingNumbers.includes(orderNumber)) {
        return res.status(400).json({ 
          message: 'El número de orden ya está en uso por otro problema' 
        })
      }
      
      problem.orderNumber = orderNumber
    }

    await user.save()

    logger.info(`Problema ${problemId} actualizado en matriz ${matrixId} para usuario ${userId}`)
    res.json({
      message: 'Problema actualizado correctamente',
      problem: problem
    })

  } catch (error) {
    logger.error('Error al actualizar problema:', error)
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: 'Errores de validación',
        errores
      })
    }

    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Obtener estadísticas de las matrices del usuario
export const getMatrixStatistics = async (req, res) => {
  try {
    const { id: userId } = req.user

    const user = await User.findById(userId).select('matrices')
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const matrices = user.matrices || []
    
    const statistics = {
      total: matrices.length,
      drafts: matrices.filter(m => m.status === 'DRAFT').length,
      completed: matrices.filter(m => m.status === 'COMPLETED').length,
      archived: matrices.filter(m => m.status === 'ARCHIVED').length,
      lastModification: matrices.length > 0 
        ? Math.max(...matrices.map(m => new Date(m.updatedAt).getTime()))
        : null
    }

    res.json({ statistics })

  } catch (error) {
    logger.error('Error al obtener estadísticas:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Endpoint temporal para limpiar matrices corruptas
export const cleanupInvalidMatrices = async (req, res) => {
  try {
    const { id: userId } = req.user

    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const originalCount = user.matrices.length
    
    // Filtrar solo matrices válidas
    user.matrices = user.matrices.filter(matrix => {
      return matrix && matrix._id && matrix.name
    })

    const cleanedCount = originalCount - user.matrices.length

    if (cleanedCount > 0) {
      await user.save()
      logger.info(`Limpiadas ${cleanedCount} matrices corruptas para usuario ${userId}`)
    }

    res.json({
      message: 'Limpieza completada',
      originalCount,
      cleanedCount,
      remainingCount: user.matrices.length
    })

  } catch (error) {
    logger.error('Error al limpiar matrices:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Endpoint de depuración para ver datos raw de matrices
export const debugMatrices = async (req, res) => {
  try {
    const { id: userId } = req.user

    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json({
      userId: userId,
      matricesCount: user.matrices.length,
      matrices: user.matrices.map((matrix, index) => ({
        index,
        _id: matrix._id,
        name: matrix.name,
        description: matrix.description,
        status: matrix.status,
        createdAt: matrix.createdAt,
        updatedAt: matrix.updatedAt,
        problemsCount: matrix.problems ? matrix.problems.length : 0,
        hasId: !!matrix._id,
        hasName: !!matrix.name,
        idType: typeof matrix._id
      }))
    })

  } catch (error) {
    logger.error('Error en debug matrices:', error)
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
