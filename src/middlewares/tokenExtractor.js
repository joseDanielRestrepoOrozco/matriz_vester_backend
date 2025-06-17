const tokenExtractor = (req, res, next) => {
  const token = req.cookies.token

  if (token) {
    req.token = token
  }

  next()
}

export default tokenExtractor
