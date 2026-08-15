// Prevent CSV / spreadsheet formula injection. Spreadsheet apps (Excel, Google
// Sheets, LibreOffice) interpret a cell whose text begins with `=`, `+`, `-` or
// `@` (and, in some parsers, a leading tab or carriage return) as a formula. If
// that text came from user input it can execute or trigger a dangerous-content
// prompt when an admin opens an exported report. Prefixing such a value with a
// single quote forces the spreadsheet to treat it as literal text.
export default function neutralizeCsvValue(value: unknown): unknown {
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}
