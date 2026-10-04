// Oracle: the server CSV writer must match the client export byte for byte.
// writeCsv runs the real csv-stringify (jest maps the browser ESM build to the
// CJS one), so a dependency bump that changes output fails here.
const {toCsv} = require('../../../functions/reports/airstat/csv');
const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');
const writeCsv = require('../writeCsv').default;

// Lone surrogates are included: both csv-stringify builds emit through a
// UTF-8 stream, so they come out as U+FFFD, matching toCsv's toWellFormed().
// Halves of one pair ('\uD83D', '\uDE00') can meet inside a cell or sit in
// neighbouring cells, where the delimiter keeps them apart on both sides.
const FRAGMENTS = [
  'a', 'Z', '0', '42', ' ', 'HB-KOF', ',', ';', '"', '""', '\n', '\r', '\r\n',
  '#', '\t', '\'', '=', '+', '-', '@', '\\', 'ä', 'ö', 'ü', 'É', 'ß', '😀',
  ' ', ' ', ' ', '﻿', '�', '\u0000', '\u001E',
  '＝', '＋', '－', '＠',
  '\uD800', '\uDC00', '\uDBFF', '\uDFFF', '\uD83D', '\uDE00',
];
const LEADS = [
  '=', '+', '-', '@', '\t', '\r', '\n', '"', ',', ';', '#', ' ', '\'',
  '＝', '﻿', '\uDC00',
];
const NUMBERS = [
  0, -0, 1, -5, 42, 1.5, -0.25, 0.1 + 0.2, 1e21, -1e21, 1e-7, -1e-7, 5e-324,
  123456789012, Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity,
];

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function randomString(rand) {
  const length = Math.floor(rand() * 7);
  let text = rand() < 0.3 ? pick(rand, LEADS) : '';
  for (let i = 0; i < length; i++) {
    text += pick(rand, FRAGMENTS);
  }
  return text;
}

// Database values (strings, numbers, booleans, null, objects, arrays) plus
// undefined for missing fields and Date. Nested cells (depth 1) do not nest.
function randomCell(rand, depth = 0) {
  const r = rand();
  if (r < 0.52) {
    return randomString(rand);
  }
  if (r < 0.58) {
    return '';
  }
  if (r < 0.62) {
    return undefined;
  }
  if (r < 0.66) {
    return null;
  }
  if (r < 0.76) {
    return rand() < 0.8 ? pick(rand, NUMBERS) : (rand() - 0.5) * 1e6;
  }
  if (r < 0.81) {
    return rand() < 0.5;
  }
  if (r < 0.84) {
    return new Date(Math.floor(rand() * 4e12) - 1e12);
  }
  if (depth > 0) {
    return randomString(rand);
  }
  if (r < 0.92) {
    return {k: randomCell(rand, 1), [randomString(rand)]: randomCell(rand, 1)};
  }
  return [randomCell(rand, 1), randomCell(rand, 1)];
}

function randomRecords(seed, count) {
  const rand = mulberry32(seed);
  const records = [];
  for (let i = 0; i < count; i++) {
    const length = Math.floor(rand() * 9);
    const record = [];
    for (let j = 0; j < length; j++) {
      record.push(randomCell(rand));
    }
    if (length > 1 && rand() < 0.03) {
      delete record[Math.floor(rand() * length)];
    }
    records.push(record);
  }
  return records;
}

// On a mismatch, narrow it down to the first differing record so the
// failure shows a small diff instead of the whole corpus.
async function expectSameCsv(records, delimiter) {
  const expected = await writeCsv(records, {delimiter});
  const actual = toCsv(records, delimiter);
  if (actual !== expected) {
    for (const record of records) {
      expect({record, csv: toCsv([record], delimiter)})
        .toEqual({record, csv: await writeCsv([record], {delimiter})});
    }
  }
  expect(actual).toBe(expected);
}

describe('util', () => {
  describe('airstatOracles/csv', () => {
    const SEEDS = [20261003, 1, 0xC0FFEE];
    const RECORDS_PER_SEED = 2000;

    describe.each([',', ';'])('delimiter %j', delimiter => {
      it.each(SEEDS)(`matches writeCsv on ${RECORDS_PER_SEED} random records (seed %i)`, async seed => {
        await expectSameCsv(randomRecords(seed, RECORDS_PER_SEED), delimiter);
      });

      it('matches writeCsv on literal edge records', async () => {
        const records = [
          ['=1+1', '+41', '-5', -5, '@x', '\tx', '\rx', '\nx', '#x'],
          ['a,b', 'a;b', 'a"b', 'a\nb', 'a\rb', 'a\r\nb', '', ' '],
          [undefined, null, false, true, 0, -0, NaN, 1e21],
          [new Date(0), new Date(NaN), {a: '=x'}, ['-y', 1], [], {}],
          ['a\uD800b', '\uDC00', '😀', ' ', '\uD83D', '\uDE00'],
          ['\uDFFF\uDBFF', '"\uD800', '\uDC00"', '😀'],
          [],
          // eslint-disable-next-line no-sparse-arrays
          [, 'hole', , ],
        ];
        await expectSameCsv(records, delimiter);
      });

      it('matches writeCsv on an empty record list', async () => {
        await expectSameCsv([], delimiter);
        await expectSameCsv([[]], delimiter);
      });

      it.each([
        ['a function', () => 1],
        ['a symbol', Symbol('s')],
      ])('fails like writeCsv on %s', async (name, cell) => {
        const records = [['a'], ['b', cell]];
        await expect(writeCsv(records, {delimiter})).rejects.toThrow();
        expect(() => toCsv(records, delimiter)).toThrow();
      });
    });
  });
});
