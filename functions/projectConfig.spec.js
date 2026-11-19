'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));

const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('firebase-functions/logger');
const { loadProjectConfig } = require('./projectConfig');

const DISABLED = { reportApiEnabled: false, mcpEnabled: false, movementWritesViaApi: false };

const CONFIG = {
  project: 'lsze',
  env: 'test',
  firebaseProjectId: 'lsze-test',
  reportApiEnabled: true,
  mcpEnabled: false,
  movementWritesViaApi: false,
  memberManagement: false,
  aerodrome: { ICAO: 'LSZE', runways: [{ name: '12', type: 'A' }] },
};

describe('functions', () => {
  describe('projectConfig', () => {
    let dir;
    let file;

    beforeEach(() => {
      jest.clearAllMocks();
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-config-'));
      file = path.join(dir, 'project-config.generated.json');
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('returns the config generated for the running project', () => {
      fs.writeFileSync(file, JSON.stringify(CONFIG));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(CONFIG);
      expect(loadProjectConfig({ file, env: { FIREBASE_CONFIG: '{"projectId":"lsze-test"}' } })).toEqual(CONFIG);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('returns a config that enables only the MCP endpoint for the running project', () => {
      const mcpOnly = { ...CONFIG, reportApiEnabled: false, mcpEnabled: true };
      fs.writeFileSync(file, JSON.stringify(mcpOnly));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(mcpOnly);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('returns a config that enables only movement writes via the API for the running project', () => {
      const writesOnly = { ...CONFIG, reportApiEnabled: false, movementWritesViaApi: true };
      fs.writeFileSync(file, JSON.stringify(writesOnly));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(writesOnly);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('disables movement writes via the API for a config generated for another project', () => {
      fs.writeFileSync(file, JSON.stringify({ ...CONFIG, reportApiEnabled: false, movementWritesViaApi: true }));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('treats a non-true movementWritesViaApi as disabled', () => {
      fs.writeFileSync(file, JSON.stringify({ ...CONFIG, reportApiEnabled: false, movementWritesViaApi: 'true' }));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(DISABLED);
    });

    it('disables the MCP endpoint for a config generated for another project', () => {
      fs.writeFileSync(file, JSON.stringify({ ...CONFIG, reportApiEnabled: false, mcpEnabled: true }));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('disables the features for a config generated for another project', () => {
      fs.writeFileSync(file, JSON.stringify(CONFIG));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual(DISABLED);
      expect(loadProjectConfig({ file, env: {} })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('disables the features silently when the file is missing locally', () => {
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(DISABLED);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs a missing file in a deployed function, not in the emulator', () => {
      const env = { GCLOUD_PROJECT: 'lsze-test', K_SERVICE: 'api' };
      expect(loadProjectConfig({ file, env })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(loadProjectConfig({ file, env: { ...env, FUNCTIONS_EMULATOR: 'true' } })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('disables the features for a file that is not a config', () => {
      fs.writeFileSync(file, '{"firebaseProjectId":');
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(DISABLED);
      expect(logger.error).toHaveBeenCalledTimes(1);
      fs.writeFileSync(file, 'null');
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual(DISABLED);
    });

    it('does not check the project when no feature is enabled', () => {
      fs.writeFileSync(file, JSON.stringify({ ...CONFIG, reportApiEnabled: false, mcpEnabled: false, movementWritesViaApi: false }));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual(DISABLED);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
