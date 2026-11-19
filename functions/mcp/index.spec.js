/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn(), warn: jest.fn() }));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));

const express = require('express');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const { LATEST_PROTOCOL_VERSION } = require('@modelcontextprotocol/sdk/types.js');
const logger = require('firebase-functions/logger');
const { registerMcpRoutes, MCP_PATHS } = require('./index');

const CONFIG = { aerodrome: { ICAO: 'LSZT', runways: [] } };

const STATUSES = {
  s1: {
    status: 'restricted',
    timestamp: Date.UTC(2026, 10, 19, 7),
    by: 'Hans Meier',
    details: 'Nur PPR',
    uid: 'uid-1234',
    email: 'hans.meier@example.com',
  },
};

function fakeDb(statuses) {
  const query = {
    orderByChild: () => query,
    limitToLast: () => query,
    once: async () => ({ val: () => statuses }),
  };
  return { ref: () => query };
}

// `bodyParser` simulates Cloud Functions, which hands the function an
// already parsed JSON body in req.body.
async function startServer({ bodyParser = false, db = () => fakeDb(STATUSES) } = {}) {
  const app = express();
  if (bodyParser) {
    app.use(express.json());
  }
  registerMcpRoutes(app, CONFIG, { db });
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  return {
    url: path => `http://127.0.0.1:${server.address().port}${path}`,
    close: () => new Promise(resolve => {
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: LATEST_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'spec', version: '0' },
  },
};

const callToolRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: { name: 'get_aerodrome_status', arguments: {} },
};

const post = (url, body) => fetch(url, {
  method: 'POST',
  headers: { ...MCP_HEADERS, 'MCP-Protocol-Version': LATEST_PROTOCOL_VERSION },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

describe('functions', () => {
  describe('mcp', () => {
    let server;

    afterEach(async () => {
      if (server) {
        await server.close();
        server = undefined;
      }
      jest.clearAllMocks();
    });

    describe('with the SDK client', () => {
      let client;

      afterEach(async () => {
        await client.close();
      });

      it('initializes, lists and calls get_aerodrome_status', async () => {
        server = await startServer();
        client = new Client({ name: 'spec', version: '0' });
        await client.connect(new StreamableHTTPClientTransport(new URL(server.url('/api/v1/mcp'))));

        expect(client.getServerVersion()).toEqual(expect.objectContaining({
          name: 'flightbox-lszt',
          title: 'Flightbox LSZT',
        }));

        const { tools } = await client.listTools();
        expect(tools).toHaveLength(1);
        expect(tools[0]).toEqual(expect.objectContaining({
          name: 'get_aerodrome_status',
          title: 'Aerodrome status',
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        }));
        expect(tools[0].outputSchema).toEqual(expect.objectContaining({ type: 'object' }));
        expect(Object.keys(tools[0].outputSchema.properties).sort())
          .toEqual(['aerodrome', 'lastUpdate', 'lastUpdateBy', 'message', 'status']);

        const result = await client.callTool({ name: 'get_aerodrome_status', arguments: {} });
        expect(result.isError).toBeFalsy();
        expect(result.structuredContent).toEqual({
          aerodrome: 'LSZT',
          status: 'restricted',
          message: 'Nur PPR',
          lastUpdate: '2026-11-19T07:00:00.000Z',
          lastUpdateBy: 'Hans Meier',
        });
        expect(result.content).toEqual([{
          type: 'text',
          text: 'LSZT is restricted. Message: Nur PPR. Last updated 2026-11-19 07:00 UTC by Hans Meier.',
        }]);
        expect(JSON.stringify(result)).not.toMatch(/uid-1234|hans\.meier@example\.com/);
      });

      it('works on /v1/mcp with a pre-parsed body (Cloud Functions)', async () => {
        server = await startServer({ bodyParser: true });
        client = new Client({ name: 'spec', version: '0' });
        await client.connect(new StreamableHTTPClientTransport(new URL(server.url('/v1/mcp'))));

        const result = await client.callTool({ name: 'get_aerodrome_status', arguments: {} });
        expect(result.structuredContent.status).toBe('restricted');
      });
    });

    describe('over plain HTTP', () => {
      it.each(MCP_PATHS)('answers initialize on %s with JSON, without a session', async path => {
        server = await startServer();
        const res = await post(server.url(path), initializeRequest);

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toMatch(/^application\/json/);
        expect(res.headers.get('mcp-session-id')).toBeNull();
        const body = await res.json();
        expect(body.result.serverInfo).toEqual(expect.objectContaining({ name: 'flightbox-lszt' }));
      });

      it.each([false, true])('calls the tool without initializing first (stateless, body parser: %s)', async bodyParser => {
        server = await startServer({ bodyParser });
        const res = await post(server.url('/api/v1/mcp'), callToolRequest);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(2);
        expect(body.result.structuredContent.status).toBe('restricted');
      });

      it.each(['GET', 'DELETE'])('answers %s with 405 and Allow: POST', async method => {
        server = await startServer();
        const res = await fetch(server.url('/api/v1/mcp'), { method, headers: { Accept: 'text/event-stream' } });

        expect(res.status).toBe(405);
        expect(res.headers.get('allow')).toBe('POST');
        const body = await res.json();
        expect(body).toEqual({
          jsonrpc: '2.0',
          error: { code: -32000, message: expect.stringContaining('Method not allowed') },
          id: null,
        });
      });

      it('answers malformed JSON with a JSON-RPC parse error', async () => {
        server = await startServer();
        const res = await post(server.url('/api/v1/mcp'), '{"jsonrpc": "2.0",');

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual(expect.objectContaining({
          jsonrpc: '2.0',
          error: expect.objectContaining({ code: -32700 }),
          id: null,
        }));
      });

      it('answers a body that is not JSON-RPC with a JSON-RPC error', async () => {
        server = await startServer({ bodyParser: true });
        const res = await post(server.url('/v1/mcp'), { hello: 'world' });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.jsonrpc).toBe('2.0');
        expect(body.error.code).toBe(-32700);
      });

      it('answers a database error with a tool error that hides the internals', async () => {
        server = await startServer({
          db: () => {
            throw new Error('FIREBASE FATAL: internal path /status');
          },
        });
        const res = await post(server.url('/api/v1/mcp'), callToolRequest);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.result.isError).toBe(true);
        expect(JSON.stringify(body)).not.toContain('FIREBASE');
        expect(logger.error).toHaveBeenCalledWith('MCP get_aerodrome_status failed', expect.any(Error));
      });

      it('answers 500 with a JSON-RPC error when the server cannot be created', async () => {
        const app = express();
        registerMcpRoutes(app, { aerodrome: null }, { db: () => fakeDb(STATUSES) });
        const listening = await new Promise(resolve => {
          const s = app.listen(0, '127.0.0.1', () => resolve(s));
        });
        server = {
          close: () => new Promise(resolve => listening.close(resolve)),
        };
        const res = await post(`http://127.0.0.1:${listening.address().port}/api/v1/mcp`, initializeRequest);

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
          jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null,
        });
        expect(logger.error).toHaveBeenCalledWith('MCP request failed', expect.any(TypeError));
      });
    });
  });
});
