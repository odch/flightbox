import parse from 'csv-parse/lib/sync';

function parseCsv(csvString) {
  try {
    const output = parse(csvString, {
      skip_empty_lines: true,
    });
    return Promise.resolve(output);
  } catch (err) {
    return Promise.reject(err);
  }
}

export default parseCsv;
