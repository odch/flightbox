'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));

const fs = require('fs');
const os = require('os');
const path = require('path');
const logger = require('firebase-functions/logger');
const { loadProjectConfig } = require('./projectConfig');

const CONFIG = {
  project: 'lsze',
  env: 'test',
  firebaseProjectId: 'lsze-test',
  reportApiEnabled: true,
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

    it('disables the features for a config generated for another project', () => {
      fs.writeFileSync(file, JSON.stringify(CONFIG));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual({ reportApiEnabled: false });
      expect(loadProjectConfig({ file, env: {} })).toEqual({ reportApiEnabled: false });
      expect(logger.error).toHaveBeenCalledTimes(2);
    });

    it('disables the features silently when the file is missing locally', () => {
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual({ reportApiEnabled: false });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs a missing file in a deployed function, not in the emulator', () => {
      const env = { GCLOUD_PROJECT: 'lsze-test', K_SERVICE: 'api' };
      expect(loadProjectConfig({ file, env })).toEqual({ reportApiEnabled: false });
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(loadProjectConfig({ file, env: { ...env, FUNCTIONS_EMULATOR: 'true' } })).toEqual({ reportApiEnabled: false });
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('disables the features for a file that is not a config', () => {
      fs.writeFileSync(file, '{"firebaseProjectId":');
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual({ reportApiEnabled: false });
      expect(logger.error).toHaveBeenCalledTimes(1);
      fs.writeFileSync(file, 'null');
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-test' } })).toEqual({ reportApiEnabled: false });
    });

    it('does not check the project when no feature is enabled', () => {
      fs.writeFileSync(file, JSON.stringify({ ...CONFIG, reportApiEnabled: false }));
      expect(loadProjectConfig({ file, env: { GCLOUD_PROJECT: 'lsze-prod' } })).toEqual({ reportApiEnabled: false });
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
