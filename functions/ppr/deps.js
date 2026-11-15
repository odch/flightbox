'use strict'

// The adapters the PPR use cases run with, for the routes with and without
// login alike: a submission is the same use case on both.
module.exports = {
  repository: require('./adapters/firebasePprRepository'),
  notifier: require('./adapters/emailNotifier'),
  settings: require('./adapters/firebasePprSettings'),
  aerodromeStatus: require('./adapters/firebaseAerodromeStatus'),
  statusTokens: require('./adapters/cryptoStatusTokens')
}
