# API de Matriz Vester - Documentación Actualizada

## Arquitectura Embebida para MongoDB (No Relacional)

### 🏗️ Estructura de Datos Embebida

```javascript
Usuario {
  id: ObjectId,
  username: String,
  email: String,
  matrices: [                    // Array de matrices embebidas
    {
      id: ObjectId,              // ID de la matriz
      nombre: String,
      descripcion: String,
      referencias: [[Number]],   // Matriz cuadrada de enteros (0-4)
      problemas: [               // Problemas embebidos en la matriz
        {
          id: ObjectId,          // ID del problema
          nombre: String,
          descripcion: String,
          numeroOrden: Number,
          createdAt: Date,
          updatedAt: Date
        }
      ],
      estado: String,            // 'BORRADOR', 'COMPLETADA', 'ARCHIVADA'
      fechaCompletado: Date,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  configuracion: {
    tema: String,
    idioma: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Ventajas de la Estructura Embebida

1. **Consistencia Transaccional**: Todas las operaciones en una matriz son atómicas
2. **Performance**: Una sola consulta obtiene todos los datos relacionados
3. **Simplicidad**: No hay JOINs complejos ni referencias externas
4. **Escalabilidad**: Cada usuario tiene sus propios datos autocontenidos

## 🛠️ Endpoints Disponibles

### 1. Crear Nueva Matriz
```http
POST /api/matriz
```

**Body:**
```json
{
  "nombre": "Análisis de Problemas Departamentales",
  "descripcion": "Matriz para identificar problemas críticos del departamento",
  "referencias": [
    [0, 2, 1, 3],
    [1, 0, 3, 2],
    [2, 1, 0, 4],
    [3, 2, 1, 0]
  ],
  "problemas": [
    {
      "nombre": "Comunicación Interna",
      "descripcion": "Falta de comunicación entre equipos",
      "numeroOrden": 1
    },
    {
      "nombre": "Recursos Limitados",
      "descripcion": "Insuficiencia de recursos para proyectos",
      "numeroOrden": 2
    },
    {
      "nombre": "Procesos Ineficientes",
      "descripcion": "Procesos que requieren optimización",
      "numeroOrden": 3
    },
    {
      "nombre": "Capacitación",
      "descripcion": "Falta de capacitación del personal",
      "numeroOrden": 4
    }
  ]
}
```

### 2. Obtener Todas las Matrices del Usuario
```http
GET /api/matriz
GET /api/matriz?estado=COMPLETADA    # Filtrar por estado
```

### 3. Obtener Matriz Específica
```http
GET /api/matriz/:matrizId
```

### 4. Actualizar Matriz
```http
PUT /api/matriz/:matrizId
```

**Body (campos opcionales):**
```json
{
  "nombre": "Nuevo nombre",
  "estado": "COMPLETADA",
  "referencias": [[...]], 
  "problemas": [...]
}
```

### 5. Eliminar Matriz
```http
DELETE /api/matriz/:matrizId
```

### 6. Actualizar Problema Específico
```http
PUT /api/matriz/:matrizId/problema/:problemaId
```

### 7. Obtener Estadísticas
```http
GET /api/matriz/estadisticas
```

## 🔐 Validaciones Implementadas

### Matriz de Referencias:
- **Tamaño**: Entre 2x2 y 20x20
- **Formato**: Cuadrada (mismas filas y columnas)
- **Valores**: Números enteros entre 0 y 4
- **Consistencia**: Número de problemas = dimensiones de matriz

### Problemas:
- **Nombre**: 1-100 caracteres, requerido
- **Descripción**: 1-500 caracteres, requerido
- **Número de Orden**: Entero >= 0, único por matriz

### Estados de Matriz:
- `BORRADOR`: Matriz en construcción
- `COMPLETADA`: Matriz lista para análisis
- `ARCHIVADA`: Matriz archivada

## 🚀 Métodos del Modelo Usuario

```javascript
// Obtener matrices activas
user.getMatricesActivas()

// Obtener matriz por ID
user.getMatrizById(matrizId)

// Agregar nueva matriz
user.agregarMatriz(datosMatriz)
```

## 📊 Índices de Base de Datos

```javascript
// Optimización de consultas
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
db.users.createIndex({ "matrices.estado": 1 })
db.users.createIndex({ "matrices.createdAt": -1 })
```

## 🎨 Ejemplo de Uso Completo

```javascript
// 1. Crear matriz
const nuevaMatriz = {
  nombre: "Matriz Organizacional 2025",
  descripcion: "Análisis de problemas organizacionales",
  referencias: [
    [0, 3, 2],
    [1, 0, 4], 
    [2, 1, 0]
  ],
  problemas: [
    {
      nombre: "Liderazgo",
      descripcion: "Problemas de liderazgo",
      numeroOrden: 1
    },
    {
      nombre: "Innovación", 
      descripcion: "Falta de innovación",
      numeroOrden: 2
    },
    {
      nombre: "Cultura",
      descripcion: "Cultura organizacional",
      numeroOrden: 3
    }
  ]
}

// 2. Enviar a POST /api/matriz
// 3. Obtener respuesta con IDs generados automáticamente
// 4. Usar los IDs para futuras operaciones
```

## 🔄 Migración de Datos

Si ya tienes datos en el formato anterior (una sola matriz por usuario), aquí tienes un script de migración:

```javascript
// Migración de matriz única a array de matrices
await User.updateMany(
  { matriz: { $exists: true, $ne: null } },
  [
    {
      $set: {
        matrices: [{
          $mergeObjects: [
            "$matriz",
            { 
              nombre: "Matriz Principal",
              estado: "COMPLETADA"
            }
          ]
        }]
      }
    },
    {
      $unset: "matriz"
    }
  ]
)
```

## ✅ Mejores Prácticas para MongoDB

1. **Limitar el tamaño**: Las matrices embebidas no deberían crecer indefinidamente
2. **Usar índices**: Para consultas frecuentes por estado o fecha
3. **Validación a nivel de esquema**: MongoDB valida automáticamente la estructura
4. **Operaciones atómicas**: Todas las modificaciones en una matriz son transaccionales
5. **Proyecciones**: Usar `.select()` para obtener solo los campos necesarios

Esta estructura embebida es **ideal para el caso de uso de Matriz Vester** porque:
- Los datos están fuertemente relacionados
- Se consultan juntos frecuentemente  
- El tamaño está controlado (matrices limitadas por usuario)
- Se mantiene la consistencia de datos
