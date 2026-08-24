/**
 * Trigger a browser download for an in-memory blob (used for the generated
 * Excel workbooks, which are too large to inline as a data URI).
 */
const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Some browsers start the download asynchronously, so revoking in this tick
  // can cancel it before it begins.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export default downloadBlob;
