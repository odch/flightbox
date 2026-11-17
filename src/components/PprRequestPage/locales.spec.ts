import de from '../../locales/de.json';
import en from '../../locales/en.json';

const keysOf = (value: unknown, prefix = ''): string[] =>
  value !== null && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

const lookup = (locale: unknown, key: string): unknown =>
  key.split('.').reduce((node: any, part) => (node == null ? undefined : node[part]), locale);

describe('PPR translations', () => {
  it('has the same keys in German and English', () => {
    expect(keysOf((en as any).ppr)).toEqual(keysOf((de as any).ppr));
  });

  it.each(['nav.ppr', 'nav.pprList', 'admin.ppr', 'validate.email', 'legal.privacyPolicy', 'datePicker.blocked'])(
    'has %s in German and English',
    key => {
      expect(lookup(de, key)).toEqual(expect.any(String));
      expect(lookup(en, key)).toEqual(expect.any(String));
    }
  );

  // e.g. {{aerodrome}}, or <1> for the link of a consent text
  it('has the same placeholders in German and English', () => {
    const placeholders = (text: unknown) => (String(text).match(/{{\w+}}|<\/?\d+>/g) || []).sort();
    keysOf((de as any).ppr).forEach(key => {
      expect([key, placeholders(lookup((en as any).ppr, key))]).toEqual([key, placeholders(lookup((de as any).ppr, key))]);
    });
  });

  it('uses Swiss German spelling (no sharp s)', () => {
    expect(JSON.stringify((de as any).ppr)).not.toContain('ß');
  });
});
