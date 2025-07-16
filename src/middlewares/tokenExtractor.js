const tokenExtractor = (req, res, next) => {
  const authorization = req.get('Authorization')

  if (authorization && authorization.startsWith('Bearer ')) {
    req.token = authorization.replace('Bearer ', '')
  }

  next()
}

export default tokenExtractor
