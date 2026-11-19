'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { aerodromeStatusTool } = require('./tools/aerodromeStatus');

const SERVER_VERSION = '1.0.0';

// Who may use a tool: 'public' tools are offered to everyone, 'user' tools
// (none yet) only to a signed-in user (context.user, set by auth.js).
const ACCESS = Object.freeze({ PUBLIC: 'public', USER: 'user' });

const TOOLS = [aerodromeStatusTool];

function isAllowed(access, context) {
  if (access === ACCESS.PUBLIC) {
    return true;
  }
  if (access === ACCESS.USER) {
    return Boolean(context && context.user);
  }
  return false;
}

// A new server per request (the endpoint is stateless). `context` is the
// request's req.mcpContext, `deps` holds what the tools read from ({ db }).
// Tools the context may not use are not registered, so they are neither
// listed nor callable.
function createMcpServer({ config, context, deps, tools = TOOLS }) {
  const icao = config.aerodrome.ICAO;
  const server = new McpServer({
    name: `flightbox-${icao.toLowerCase()}`,
    title: `Flightbox ${icao}`,
    version: SERVER_VERSION,
  }, {
    instructions: `Flightbox is the flight operations system of aerodrome ${icao}. `
      + 'Use get_aerodrome_status to find out whether the aerodrome is open, restricted or closed. '
      + 'The status is set by the aerodrome staff and is no substitute for NOTAM or AIP.',
  });

  tools
    .filter(tool => isAllowed(tool.access, context))
    .forEach(tool => {
      server.registerTool(tool.name, tool.definition(config), tool.handler({ config, context, deps }));
    });

  return server;
}

module.exports = {
  ACCESS,
  createMcpServer,
};
