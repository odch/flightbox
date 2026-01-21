import {stringify} from 'csv-stringify/browser/esm'

function writeCsv(records, options={}) {
  return new Promise((resolve, reject) => {
    stringify(records, options, function(err, csv){
      if (err) {
        reject(err);
      } else {
        resolve(csv);
      }
    });
  });
}

export default writeCsv;
