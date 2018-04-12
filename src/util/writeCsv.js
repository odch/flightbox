import stringify from 'csv-stringify';

function writeCsv(records) {
  return new Promise((resolve, reject) => {
    stringify(records, function(err, csv){
      if (err) {
        reject(err);
      } else {
        resolve(csv);
      }
    });
  });
}

export default writeCsv;
