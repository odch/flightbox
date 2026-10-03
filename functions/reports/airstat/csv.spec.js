const { toCsv } = require('./csv');

describe('functions', () => {
  describe('reports/airstat/csv', () => {
    describe('toCsv cell rules', () => {
      // [cell, expected with ',', expected with ';']
      const table = [
        ['plain', 'plain', 'plain'],
        ['', '', ''],
        ['a,b', '"a,b"', 'a,b'],
        ['a;b', 'a;b', '"a;b"'],
        ['say "hi"', '"say ""hi"""', '"say ""hi"""'],
        ['"', '""""', '""""'],
        ['a\nb', '"a\nb"', '"a\nb"'],
        ['a\rb', '"a\rb"', '"a\rb"'],
        ['a\r\nb', '"a\r\nb"', '"a\r\nb"'],
        ['#comment', '#comment', '#comment'],
        ['a\tb', 'a\tb', 'a\tb'],
        ['\u2028', '\u2028', '\u2028'],
        ['Zürich 😀', 'Zürich 😀', 'Zürich 😀'],
        [' x ', ' x ', ' x '],
        ['\'', '\'', '\''],
        ['=1+1', '\'=1+1', '\'=1+1'],
        ['+41 79', '\'+41 79', '\'+41 79'],
        ['-5', '\'-5', '\'-5'],
        ['@x', '\'@x', '\'@x'],
        ['\tx', '\'\tx', '\'\tx'],
        ['\rx', '"\'\rx"', '"\'\rx"'],
        ['\nx', '"\nx"', '"\nx"'],
        [' =x', ' =x', ' =x'],
        ['a=b', 'a=b', 'a=b'],
        ['=a,b', '"\'=a,b"', '\'=a,b'],
        ['=a;b', '\'=a;b', '"\'=a;b"'],
        ['="x"', '"\'=""x"""', '"\'=""x"""'],
        [-5, '-5', '-5'],
        [0, '0', '0'],
        [-0, '0', '0'],
        [1.5, '1.5', '1.5'],
        [1e21, '1e+21', '1e+21'],
        [NaN, 'NaN', 'NaN'],
        [Infinity, 'Infinity', 'Infinity'],
        [undefined, '', ''],
        [null, '', ''],
        [false, '', ''],
        [true, '1', '1'],
        [new Date(Date.UTC(2026, 9, 3)), '1790985600000', '1790985600000'],
        [new Date(NaN), 'NaN', 'NaN'],
        [{ a: 1 }, '"{""a"":1}"', '"{""a"":1}"'],
        [{ a: 'x;y' }, '"{""a"":""x;y""}"', '"{""a"":""x;y""}"'],
        [[1, 2], '"[1,2]"', '[1,2]'],
        [[], '[]', '[]'],
        ['a\uD800b', 'a\uFFFDb', 'a\uFFFDb'],
        ['\uDC00', '\uFFFD', '\uFFFD'],
        ['\uDFFF\uDBFF', '\uFFFD\uFFFD', '\uFFFD\uFFFD'],
        ['\uD83D\uDE00', '😀', '😀'],
        ['😀', '😀', '😀'],
      ];

      it.each(table)('formats %j as %j with "," and %j with ";"', (cell, comma, semicolon) => {
        expect(toCsv([[cell]])).toBe(`${comma}\n`);
        expect(toCsv([[cell]], ',')).toBe(`${comma}\n`);
        expect(toCsv([[cell]], ';')).toBe(`${semicolon}\n`);
      });
    });

    describe('toCsv rows', () => {
      it('joins cells with the delimiter and ends every row with \\n', () => {
        const rows = [['A', 'B', 'C'], ['1', 2, null], [undefined, 'x,y', 'x;y']];
        expect(toCsv(rows)).toBe('A,B,C\n1,2,\n,"x,y",x;y\n');
        expect(toCsv(rows, ';')).toBe('A;B;C\n1;2;\n;x,y;"x;y"\n');
      });

      it('neutralizes the header row too', () => {
        expect(toCsv([['-H', '=H'], ['a', 'b']])).toBe('\'-H,\'=H\na,b\n');
      });

      it('returns an empty string for no rows and \\n for an empty row', () => {
        expect(toCsv([])).toBe('');
        expect(toCsv([], ';')).toBe('');
        expect(toCsv([[]])).toBe('\n');
        expect(toCsv([[], []])).toBe('\n\n');
      });

      it('renders holes in sparse rows as empty cells', () => {
        // eslint-disable-next-line no-sparse-arrays
        expect(toCsv([[, 'a', , 'b']])).toBe(',a,,b\n');
      });

      it('writes no BOM', () => {
        expect(toCsv([['a']]).charCodeAt(0)).toBe(0x61);
      });

      it('keeps the halves of a surrogate pair in neighbouring cells apart', () => {
        expect(toCsv([['\uD83D', '\uDE00']])).toBe('�,�\n');
        expect(toCsv([['\uD83D'], ['\uDE00']], ';')).toBe('�\n�\n');
      });

      it('rejects other delimiters', () => {
        expect(() => toCsv([['a']], '|')).toThrow(RangeError);
        expect(() => toCsv([['a']], '\t')).toThrow(RangeError);
        expect(() => toCsv([['a']], ',,')).toThrow(RangeError);
        expect(() => toCsv([['a']], '')).toThrow(RangeError);
        expect(() => toCsv([['a']], null)).toThrow(RangeError);
        expect(() => toCsv([], '|')).toThrow(RangeError);
      });

      it('rejects rows that are not arrays', () => {
        expect(() => toCsv('ab')).toThrow(TypeError);
        expect(() => toCsv(undefined)).toThrow(TypeError);
        expect(() => toCsv([['a'], 'bc'])).toThrow(TypeError);
        expect(() => toCsv([{ a: 1 }])).toThrow(TypeError);
        expect(() => toCsv([['a'], null])).toThrow(TypeError);
        // eslint-disable-next-line no-sparse-arrays
        expect(() => toCsv([, ['a']])).toThrow(TypeError);
      });

      it('rejects functions, symbols and bigints', () => {
        expect(() => toCsv([[() => 1]])).toThrow(TypeError);
        expect(() => toCsv([[Symbol('s')]])).toThrow(TypeError);
        expect(() => toCsv([[10n]])).toThrow(TypeError);
      });
    });
  });
});
