'use strict';

// The auth slot of the MCP endpoint. For now every request is anonymous, so
// only public tools are offered (see server.js). OAuth will replace this
// middleware: it will verify the bearer token, set the signed-in user on
// req.mcpContext and answer 401 with WWW-Authenticate when the token is not
// valid. No token is parsed yet.
function mcpAuth(req, res, next) {
  req.mcpContext = { user: null };
  next();
}

module.exports = { mcpAuth };
