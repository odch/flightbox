/** @jest-environment node */
'use strict';

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js');
const { createMcpServer, ACCESS } = require('./server');

const CONFIG = { aerodrome: { ICAO: 'LSZT', runways: [] } };

const fakeTool = (name, access) => ({
  name,
  access,
  definition: () => ({ description: name }),
  handler: () => () => ({ content: [{ type: 'text', text: name }] }),
});

async function connect(options) {
  const server = createMcpServer({ config: CONFIG, deps: {}, ...options });
  const client = new Client({ name: 'spec', version: '0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

const toolNames = async client => (await client.listTools()).tools.map(tool => tool.name);

describe('functions', () => {
  describe('mcp', () => {
    describe('server', () => {
      const open = [];

      afterEach(async () => {
        await Promise.all(open.splice(0).map(({ client }) => client.close()));
      });

      const connected = async options => {
        const connection = await connect(options);
        open.push(connection);
        return connection.client;
      };

      it('names the server after the aerodrome and gives instructions', async () => {
        const client = await connected({ context: { user: null } });

        expect(client.getServerVersion()).toEqual(expect.objectContaining({
          name: 'flightbox-lszt',
          title: 'Flightbox LSZT',
          version: expect.any(String),
        }));
        expect(client.getInstructions()).toContain('get_aerodrome_status');
      });

      it('offers the aerodrome status to anonymous requests', async () => {
        const client = await connected({ context: { user: null } });

        expect(await toolNames(client)).toEqual(['get_aerodrome_status']);
      });

      it('registers user tools only for a signed-in user', async () => {
        const tools = [fakeTool('public_tool', ACCESS.PUBLIC), fakeTool('user_tool', ACCESS.USER)];

        expect(await toolNames(await connected({ context: { user: null }, tools }))).toEqual(['public_tool']);
        expect(await toolNames(await connected({ context: undefined, tools }))).toEqual(['public_tool']);
        expect(await toolNames(await connected({ context: { user: { uid: 'u1' } }, tools })))
          .toEqual(['public_tool', 'user_tool']);

        const anonymous = await connected({ context: { user: null }, tools });
        const result = await anonymous.callTool({ name: 'user_tool' });
        expect(result.isError).toBe(true);
      });

      it('never registers a tool with an unknown access level', async () => {
        const tools = [fakeTool('public_tool', ACCESS.PUBLIC), fakeTool('odd_tool', 'admin')];
        const client = await connected({ context: { user: { uid: 'u1' } }, tools });

        expect(await toolNames(client)).toEqual(['public_tool']);
      });
    });
  });
});
