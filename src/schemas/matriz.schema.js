import { z } from 'zod'

// Schema para validar un problema individual
export const problemSchema = z.object({
  name: z.string({
    required_error: 'El nombre es requerido'
  }).min(1, {
    message: 'El nombre no puede estar vacío'
  }).max(100, {
    message: 'El nombre no puede exceder 100 caracteres'
  }).trim(),
  
  description: z.string({
    required_error: 'La descripción es requerida'
  }).min(1, {
    message: 'La descripción no puede estar vacía'
  }).max(500, {
    message: 'La descripción no puede exceder 500 caracteres'
  }).trim(),
  
  orderNumber: z.number({
    required_error: 'El número de orden es requerido',
    invalid_type_error: 'El número de orden debe ser un número entero'
  }).int({
    message: 'El número de orden debe ser un número entero'
  }).min(0, {
    message: 'El número de orden debe ser mayor o igual a 0'
  })
})

// Schema base para matriz (sin validaciones cruzadas)
const matrixBaseSchema = z.object({
  name: z.string({
    required_error: 'El nombre de la matriz es requerido'
  }).min(1, {
    message: 'El nombre no puede estar vacío'
  }).max(100, {
    message: 'El nombre no puede exceder 100 caracteres'
  }).trim(),

  description: z.string().max(500, {
    message: 'La descripción no puede exceder 500 caracteres'
  }).trim().optional(),

  references: z.array(
    z.array(z.number().int({
      message: 'Todos los elementos de la matriz deben ser números enteros'
    }).min(0, {
      message: 'Los valores deben ser entre 0 y 4'
    }).max(4, {
      message: 'Los valores deben ser entre 0 y 4'
    }), {
      required_error: 'Cada fila debe ser un array de números'
    }),
    {
      required_error: 'Referencias debe ser un array de arrays'
    }
  )
  .min(2, {
    message: 'La matriz debe tener al menos 2x2'
  })
  .max(20, {
    message: 'La matriz no puede ser mayor a 20x20'
  })
  .refine((matrix) => {
    // Validar que sea una matriz cuadrada
    if (matrix.length === 0) return false
    const size = matrix.length
    return matrix.every(row => Array.isArray(row) && row.length === size)
  }, {
    message: 'La matriz debe ser cuadrada (mismo número de filas y columnas)'
  }),

  problems: z.array(problemSchema, {
    required_error: 'Los problemas son requeridos'
  })
  .min(2, {
    message: 'Debe haber al menos 2 problemas'
  }),

  status: z.enum(['DRAFT', 'COMPLETED', 'ARCHIVED'], {
    invalid_type_error: 'El estado debe ser DRAFT, COMPLETED o ARCHIVED'
  }).optional().default('DRAFT')
})

// Schema para crear matriz (con todas las validaciones)
export const createMatrixSchema = matrixBaseSchema
  .refine((data) => {
    // Validar que el número de problemas coincida con las dimensiones de la matriz
    return data.problems.length === data.references.length
  }, {
    message: 'El número de problemas debe coincidir con las dimensiones de la matriz'
  })
  .refine((data) => {
    // Validar que no haya números de orden duplicados
    const orderNumbers = data.problems.map(p => p.orderNumber)
    const uniqueNumbers = new Set(orderNumbers)
    return uniqueNumbers.size === orderNumbers.length
  }, {
    message: 'Los números de orden de los problemas deben ser únicos'
  })

// Schema para actualizar matriz (campos opcionales)
export const updateMatrixSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  references: z.array(
    z.array(z.number().int().min(0).max(4))
  ).optional(),
  problems: z.array(problemSchema).optional(),
  status: z.enum(['DRAFT', 'COMPLETED', 'ARCHIVED']).optional()
})
.refine((data) => {
  // Si se actualizan referencias y problemas, validar consistencia
  if (data.references && data.problems) {
    return data.problems.length === data.references.length
  }
  return true
}, {
  message: 'Si actualizas referencias y problemas, deben tener las mismas dimensiones'
})
.refine((data) => {
  // Si se actualizan los problemas, validar números de orden únicos
  if (data.problems) {
    const orderNumbers = data.problems.map(p => p.orderNumber)
    const uniqueNumbers = new Set(orderNumbers)
    return uniqueNumbers.size === orderNumbers.length
  }
  return true
}, {
  message: 'Los números de orden de los problemas deben ser únicos'
})
