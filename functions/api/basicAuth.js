const functions = require('firebase-functions')

const config = functions.config();

const basicAuth = (req, res, next) => {
  if (!config.api || !config.api.serviceuser || !config.api.serviceuser.username || !config.api.serviceuser.password) {
    console.info(
      "Set configuration properties `api.serviceuser.username` and `api.serviceuser.password` for the API auth"
    )
    res.status(401).send('Unauthorized')
    return
  }

  const authHeader = req.headers.authorization || ''
  const [type, credentials] = authHeader.split(' ')

  if (type === 'Basic' && credentials) {
    const decoded = Buffer.from(credentials, 'base64').toString('utf-8')
    const [username, password] = decoded.split(':')

    if (username === config.api.serviceuser.username && password === config.api.serviceuser.password) {
      return next()
    }
  }

  res.status(401).send('Unauthorized')
}

module.exports = basicAuth
