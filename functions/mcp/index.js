'use strict';

const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const { mcpAuth } = require('./auth');

const MCP_PATHS = ['/v1/mcp', '/api/v1/mcp'];

// The SDK (with zod and ajv) is loaded on the first MCP request, not at
// module load: functions/index.js loads the api module in every function,
// so a top-level require would add to the cold start of all of them.
let sdk;
function loadSdk() {
  if (!sdk) {
    const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const { createMcpServer } = require('./server');
    sdk = { StreamableHTTPServerTransport, createMcpServer };
  }
  return sdk;
}

const jsonRpcError = (code, message) => ({ jsonrpc: '2.0', error: { code, message }, id: null });

// Stateless Streamable HTTP: each POST gets its own server and transport,
// answered with plain JSON (no SSE, no session). Cloud Functions has already
// parsed a JSON body into req.body; elsewhere (no body parser) req.body is
// undefined and the transport reads the request itself.
function createMcpHandler(config, deps) {
  return async (req, res) => {
    let server;
    let transport;
    res.on('close', () => {
      if (transport) {
        transport.close().catch(e => logger.warn('MCP transport close failed', e));
      }
      if (server) {
        server.close().catch(e => logger.warn('MCP server close failed', e));
      }
    });
    try {
      const { StreamableHTTPServerTransport, createMcpServer } = loadSdk();
      server = createMcpServer({ config, context: req.mcpContext, deps });
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      logger.error('MCP request failed', e);
      if (!res.headersSent) {
        res.status(500).json(jsonRpcError(-32603, 'Internal server error'));
      }
    }
  };
}

// The stateless server has no SSE stream to open (GET) and no session to
// end (DELETE).
function methodNotAllowed(req, res) {
  res.set('Allow', 'POST');
  res.status(405).json(jsonRpcError(-32000, 'Method not allowed: this MCP server is stateless and only accepts POST'));
}

// Public for now; mcpAuth is where OAuth will plug in.
function registerMcpRoutes(app, config, { db = getDatabase } = {}) {
  app.post(MCP_PATHS, mcpAuth, createMcpHandler(config, { db }));
  app.get(MCP_PATHS, methodNotAllowed);
  app.delete(MCP_PATHS, methodNotAllowed);
}

module.exports = {
  MCP_PATHS,
  registerMcpRoutes,
};
