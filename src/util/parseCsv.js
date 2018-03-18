import parse from 'csv-parse';

function parseCsv(csvString) {
  return new Promise((resolve, reject) => {
    const parseOptions = {
      skip_empty_lines: true,
    };
    parse(csvString, parseOptions, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

export default parseCsv;
