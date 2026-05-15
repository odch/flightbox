const expectedUsername = process.env.API_SERVICEUSER_USERNAME
const expectedPassword = process.env.API_SERVICEUSER_PASSWORD

const basicAuth = (req, res, next) => {
  if (!expectedUsername || !expectedPassword) {
    console.info(
      "Set API_SERVICEUSER_USERNAME and API_SERVICEUSER_PASSWORD env vars for the API auth"
    )
    res.status(401).send('Unauthorized')
    return
  }

  const authHeader = req.headers.authorization || ''
  const [type, credentials] = authHeader.split(' ')

  if (type === 'Basic' && credentials) {
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
    const [username, password] = decoded.split(':')

    if (username === expectedUsername && password === expectedPassword) {
      return next()
    }
  }

  res.status(401).send('Unauthorized')
}

module.exports = basicAuth
