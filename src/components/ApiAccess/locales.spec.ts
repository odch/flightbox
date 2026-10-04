import de from '../../locales/de.json';
import en from '../../locales/en.json';

const keysOf = (value: unknown, prefix = ''): string[] =>
  value !== null && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe('API access translations', () => {
  it('has the same keys in German and English', () => {
    expect(keysOf((en as any).apiAccess)).toEqual(keysOf((de as any).apiAccess));
    expect((de as any).admin.apiAccess).toBe('API-Zugriff');
    expect((en as any).admin.apiAccess).toBe('API access');
  });

  it('uses Swiss German spelling (no sharp s)', () => {
    expect(JSON.stringify((de as any).apiAccess)).not.toContain('ß');
  });
});
