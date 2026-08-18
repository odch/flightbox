const admin = require('firebase-admin')

const fbAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    console.info(
      "Authorization header missing in request, returning 401 Unauthorized"
    )
    res.status(401).send('Unauthorized')
    return
  }

  const [type, idToken] = authHeader.split(' ')

  if (type !== 'Bearer') {
    console.info(
      "Authorization header not of type 'Bearer', returning 401 Unauthorized"
    )
    res.status(401).send('Unauthorized')
    return
  }

  try {
    // Pass checkRevoked=true so revoked sessions and disabled accounts are
    // rejected immediately (matches the WebAuthn path in webauthnHelpers.js),
    // rather than remaining valid until the ID token expires.
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    const uid = decodedToken.uid;
    console.log('Authenticated user:', uid);

    req.fbUserId = uid
    req.fbUserEmail = decodedToken.email
    return next()

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send('Unauthorized');
  }
}

const fbAdminAuth = async (req, res, next) => {
  await fbAuth(req, res, async () => {
    const uid = req.fbUserId;
    try {
      const snapshot = await admin.database().ref(`/admins/${uid}`).once('value');
      const isAdmin = snapshot.val() === true;

      if (!isAdmin) {
        console.info(`User ${uid} is not an admin. Returning 403 Forbidden.`);
        return res.status(403).send('Forbidden: Admins only');
      }

      next();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
}

// Shared-access sessions (guest / kiosk) authenticate with a fixed uid. Some
// routes must stay off-limits to them — e.g. driving the trusted customs
// integration — even though they are otherwise authenticated.
const SHARED_SESSION_UIDS = ['guest', 'kiosk']

const fbAuthExcludingShared = async (req, res, next) => {
  await fbAuth(req, res, () => {
    if (SHARED_SESSION_UIDS.includes(req.fbUserId)) {
      console.info(`Shared session '${req.fbUserId}' rejected on restricted route. Returning 403 Forbidden.`)
      return res.status(403).send('Forbidden: not available to shared sessions')
    }
    return next()
  })
}

module.exports = {
  fbAuth,
  fbAdminAuth,
  fbAuthExcludingShared
}
