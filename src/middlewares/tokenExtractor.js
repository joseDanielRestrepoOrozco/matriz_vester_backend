const tokenExtractor = (req, res, next) => {
  const token = req.cookies.token

  console.log('Token extracted:', token)

  if (token) {
    req.token = token
  }

  next()
}

export default tokenExtractor
