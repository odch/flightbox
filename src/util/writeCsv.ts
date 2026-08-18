import {stringify} from 'csv-stringify/browser/esm'
import neutralizeCsvValue from './neutralizeCsvValue'

function neutralizeRecord(record) {
  if (Array.isArray(record)) {
    return record.map(neutralizeCsvValue);
  }
  if (record && typeof record === 'object') {
    const out = {};
    Object.keys(record).forEach(key => {
      out[key] = neutralizeCsvValue(record[key]);
    });
    return out;
  }
  return neutralizeCsvValue(record);
}

function writeCsv(records, options={}) {
  const safeRecords = Array.isArray(records) ? records.map(neutralizeRecord) : records;
  return new Promise((resolve, reject) => {
    stringify(safeRecords, options, function(err, csv){
      if (err) {
        reject(err);
      } else {
        resolve(csv);
      }
    });
  });
}

export default writeCsv;
