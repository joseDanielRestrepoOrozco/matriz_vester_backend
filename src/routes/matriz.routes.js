import { Router } from 'express'
import {
  createMatrix,
  getMatrices,
  getMatricesBasics,
  getMatrixById,
  updateMatrix,
  deleteMatrix,
  updateProblem,
  getMatrixStatistics,
  createSampleMatrices,
  cleanupInvalidMatrices,
  debugMatrices
} from '../controllers/matriz.controller.js'
import authRequired from '../middlewares/authRequired.js'
import { validateSchema } from '../middlewares/validator.middleware.js'
import { createMatrixSchema, updateMatrixSchema, problemSchema } from '../schemas/matriz.schema.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authRequired)

// CRUD para matrices
router.post('/', validateSchema(createMatrixSchema), createMatrix)
router.post('/samples', createSampleMatrices) // Endpoint temporal para crear matrices de ejemplo
router.post('/cleanup', cleanupInvalidMatrices) // Endpoint temporal para limpiar matrices corruptas
router.get('/debug', debugMatrices) // Endpoint de depuración
router.get('/', getMatrices)
router.get('/basics', getMatricesBasics) // Nuevo endpoint para sidebar
router.get('/statistics', getMatrixStatistics)
router.get('/:matrixId', getMatrixById)
router.put('/:matrixId', validateSchema(updateMatrixSchema), updateMatrix)
router.delete('/:matrixId', deleteMatrix)

// CRUD para problemas dentro de una matriz específica
router.put('/:matrixId/problem/:problemId', validateSchema(problemSchema), updateProblem)

export default router
