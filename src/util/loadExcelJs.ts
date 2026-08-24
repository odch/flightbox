/**
 * exceljs weighs about a megabyte, so it is loaded on demand. Keeping the
 * dynamic import in its own module lets webpack split it into a separate chunk
 * that is only fetched when a report is actually generated, and gives tests a
 * single seam to stub.
 */

/**
 * Under a raw ESM dynamic import, a CJS module like exceljs is only reachable
 * via `.default`; some bundler/interop combinations instead (or additionally)
 * expose its named exports directly on the namespace object. Exported as a
 * pure function so both shapes can be tested deterministically — a mocked
 * dynamic import goes through Babel's own interop shim, which does not
 * reliably keep the two shapes distinct.
 */
export const resolveWorkbookConstructor = (excelJsModule: any): any =>
  excelJsModule.Workbook || excelJsModule.default.Workbook;

const loadWorkbookConstructor = async (): Promise<any> => {
  const excelJs: any = await import('exceljs');
  return resolveWorkbookConstructor(excelJs);
};

export default loadWorkbookConstructor;
