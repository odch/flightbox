'use strict';

const fs = require('fs');
const path = require('path');

// The engine is required by src specs in the CI job that installs only the
// root dependencies, and must not add packages to every function's cold
// start. So engine files are CommonJS and may only require relative files
// in this folder.
function engineFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return engineFiles(file);
    }
    return /\.[cm]?js$/.test(entry.name) && !/\.spec\.[cm]?js$/.test(entry.name) ? [file] : [];
  });
}

describe('functions', () => {
  describe('reports/airstat', () => {
    const files = engineFiles(__dirname);

    it('finds the engine files', () => {
      expect(files.length).toBeGreaterThan(0);
    });

    it.each(files.map(file => [path.relative(__dirname, file), file]))(
      '%s loads only relative files inside the engine',
      (name, file) => {
        const source = fs.readFileSync(file, 'utf8');
        expect(source).not.toMatch(/^\s*(?:import|export)\b/m);
        expect(source).not.toMatch(/\bimport\s*\(/);

        const calls = source.match(/\brequire\s*\(/g) || [];
        const requests = [...source.matchAll(/\brequire\s*\(\s*(['"])([^'"]+)\1\s*\)/g)]
          .map(match => match[2]);

        expect(requests).toHaveLength(calls.length);
        requests.forEach(request => {
          expect(request).toMatch(/^\.\.?\//);
          const resolved = path.resolve(path.dirname(file), request);
          expect(resolved.startsWith(__dirname + path.sep)).toBe(true);
        });
      }
    );
  });
});
