import de from '../../locales/de.json';
import en from '../../locales/en.json';

const keysOf = (value: unknown, prefix = ''): string[] =>
  value !== null && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe('customs self-declaration translations', () => {
  it.each(['adminCustomsSelfDeclaration', 'customsSyncStatus'])('has the same %s keys in German and English', namespace => {
    expect(keysOf((en as any)[namespace])).toEqual(keysOf((de as any)[namespace]));
    expect(keysOf((de as any)[namespace]).length).toBeGreaterThan(0);
  });

  it('names the admin tab in both languages', () => {
    expect((de as any).admin.customsSelfDeclaration).toBe('Zoll-Selbstdeklaration');
    expect((en as any).admin.customsSelfDeclaration).toBe('Customs self-declaration');
  });

  it('uses Swiss German spelling (no sharp s)', () => {
    expect(JSON.stringify((de as any).adminCustomsSelfDeclaration)).not.toContain('ß');
    expect(JSON.stringify((de as any).customsSyncStatus)).not.toContain('ß');
  });
});
