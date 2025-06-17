import app from './app.js'

import config from './config.js'
import logger from './libs/logger.js'

const PORT = config.PORT

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
