import InvoicesReportData from './InvoicesReportData';
import dates from '../util/dates';
import {getLabel as getFlightTypeLabel} from '../util/flightTypes';
import i18n from '../i18n';
import loadWorkbookConstructor from './loadExcelJs';

const t = i18n.getFixedT('de');

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MONEY_FORMAT = '#,##0.00';
const DATE_FORMAT = 'dd.mm.yyyy';

// Excel rejects these characters in worksheet names and caps them at 31 chars.
const FORBIDDEN_SHEET_NAME_CHARS = /[[\]:*?/\\]/g;
const MAX_SHEET_NAME_LENGTH = 31;
// A worksheet name may not start or end with a single quote, and 'History' is
// reserved. exceljs throws on all of these, which would abort the whole report.
const EDGE_QUOTES = /^'+|'+$/g;
const RESERVED_SHEET_NAME = 'History';

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface Column {
  header: string;
  width: number;
  numFmt?: string;
  /** Whether the table's totals row sums this column. */
  total?: boolean;
}

/**
 * Convert a 1-based column index to its spreadsheet letter (1 -> A, 27 -> AA).
 */
export const columnLetter = (index: number): string => {
  let letter = '';
  let remaining = index;
  while (remaining > 0) {
    letter = String.fromCharCode(65 + ((remaining - 1) % 26)) + letter;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return letter;
};

/**
 * Turn a local `YYYY-MM-DD` date into a real date cell value. Built in UTC so
 * the writer's timezone can never shift it onto the neighbouring day. Anything
 * that is not a plain local date is passed through as-is.
 */
export const toDateValue = (localDate: any): any => {
  if (typeof localDate !== 'string') {
    return localDate;
  }
  const match = LOCAL_DATE_PATTERN.exec(localDate);
  if (!match) {
    return localDate;
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

/**
 * Make a recipient name usable as a worksheet name: drop the characters Excel
 * forbids, keep it within the length limit, and disambiguate against the names
 * already used in this workbook. Recipient names are user-controlled, so none
 * of these can be assumed away.
 */
export const sanitizeSheetName = (name: string, usedNames: string[] = []): string => {
  const trim = (value: string) => value.replace(EDGE_QUOTES, '').trim();

  const cleaned = trim(
    String(name == null ? '' : name).replace(FORBIDDEN_SHEET_NAME_CHARS, ' ')
  );

  // Truncating can expose a new trailing quote, so trim again afterwards.
  const base = trim(
    (cleaned || t('invoicesReport.sheetNameFallback')).substring(0, MAX_SHEET_NAME_LENGTH)
  ) || t('invoicesReport.sheetNameFallback');

  // exceljs compares worksheet names case-insensitively, so the check has to.
  const isTaken = (candidate: string) =>
    candidate === RESERVED_SHEET_NAME ||
    usedNames.some(used => used.toLowerCase() === candidate.toLowerCase());

  if (!isTaken(base)) {
    return base;
  }

  for (let counter = 2; ; counter++) {
    const suffix = ` (${counter})`;
    const candidate =
      base.substring(0, MAX_SHEET_NAME_LENGTH - suffix.length).trim() + suffix;
    if (!isTaken(candidate)) {
      return candidate;
    }
  }
};

/**
 * Amounts reach a numeric cell verbatim, so anything that is not a finite
 * number becomes an empty cell instead. A NaN would otherwise be written as
 * `<v>NaN</v>`, which Excel reports as a corrupt workbook, and a single bad row
 * would poison its column's total.
 */
const toAmount = (value: any): number | null =>
  typeof value === 'number' && isFinite(value) ? value : null;

const addAmounts = (totals: number[], amounts: (number | null)[]) => {
  amounts.forEach((amount, index) => {
    if (amount !== null) {
      totals[index] += amount;
    }
  });
};

/**
 * The invoice recipient report as an Excel workbook: one worksheet per
 * recipient, mirroring the one-page-per-recipient layout of the PDF version.
 *
 * Unlike the PDF, amounts are written as real numbers and every totals row is a
 * SUM formula, so recipients can filter, correct and re-sum rows in place. Each
 * formula also carries its computed result as a cached value, because tools
 * that do not evaluate formulas (pandas/openpyxl read with `data_only=True`)
 * otherwise read those cells as empty.
 */
class InvoicesExcelReport extends InvoicesReportData {

  /**
   * Resolves with the workbook as a blob. Rejections propagate to the caller so
   * a failure cannot leave the report stuck as "in progress".
   */
  generate(): Promise<Blob> {
    return this.collect().then(data => this.build(data));
  }

  async build({recipientNames, arrivalRecipients, customsRecipients}) {
    const Workbook = await loadWorkbookConstructor();

    const workbook = new Workbook();
    workbook.created = this.creationDate.toDate();
    // Recalculate on open so the totals can never be shown from a stale cache.
    workbook.calcProperties.fullCalcOnLoad = true;

    this.addSheets(workbook, recipientNames, arrivalRecipients, customsRecipients);

    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {type: XLSX_MIME_TYPE});
  }

  addSheets(workbook, recipientNames, arrivalRecipients, customsRecipients) {
    if (recipientNames.length === 0) {
      const sheet = workbook.addWorksheet(t('invoicesReport.sheetNameFallback'));
      sheet.addRow([t('invoicesReport.noRecipients', {month: this.getMonthLabel()})]);
      return;
    }

    const monthLabel = this.getMonthLabel();
    const usedSheetNames: string[] = [];

    recipientNames.forEach(recipientName => {
      const sheetName = sanitizeSheetName(recipientName, usedSheetNames);
      usedSheetNames.push(sheetName);

      const sheet = workbook.addWorksheet(sheetName);

      const titleRow = sheet.addRow([`${recipientName} (${monthLabel})`]);
      titleRow.getCell(1).font = {bold: true, size: 14};

      this.addLandingFeesTable(sheet, arrivalRecipients[recipientName]);
      this.addCustomsFeesTable(sheet, customsRecipients[recipientName], false);
      this.addCustomsFeesTable(sheet, customsRecipients[recipientName], true);
    });
  }

  landingFeeColumns(): Column[] {
    return [
      {header: t('invoicesReport.colDate'), width: 12, numFmt: DATE_FORMAT},
      {header: t('invoicesReport.colTime'), width: 8},
      {header: t('invoicesReport.colImmatriculation'), width: 15},
      {header: 'MTOW', width: 8},
      {header: t('invoicesReport.colFirstname'), width: 16},
      {header: t('invoicesReport.colLastname'), width: 16},
      {header: t('invoicesReport.colEmail'), width: 30},
      {header: t('invoicesReport.colFlightType'), width: 18},
      {header: t('invoicesReport.colSubtotal'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colVat'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colRounding'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colTotal'), width: 12, numFmt: MONEY_FORMAT, total: true},
    ];
  }

  customsFeeColumns(): Column[] {
    return [
      {header: t('invoicesReport.colDate'), width: 12, numFmt: DATE_FORMAT},
      {header: t('invoicesReport.colImmatriculation'), width: 15},
      {header: t('invoicesReport.colEmail'), width: 30},
      {header: t('invoicesReport.colDirection'), width: 18},
      {header: t('invoicesReport.colSubtotal'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colVat'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colRounding'), width: 12, numFmt: MONEY_FORMAT, total: true},
      {header: t('invoicesReport.colTotal'), width: 12, numFmt: MONEY_FORMAT, total: true},
    ];
  }

  addLandingFeesTable(sheet, arrivals) {
    if (!arrivals || arrivals.length === 0) {
      return;
    }

    const totals = [0, 0, 0, 0];

    const rows = arrivals.map(arrival => {
      const {
        date,
        time,
        immatriculation,
        mtow,
        firstname,
        lastname,
        email,
        flightType,
        feeTotalNet,
        feeVat,
        feeRoundingDifference,
        feeTotalGross,
        landingFeeTotal // fallback only for the "transition" month
      } = arrival;

      const amounts = typeof feeTotalGross === 'number'
        ? [
          toAmount(feeTotalNet),
          toAmount(feeVat),
          toAmount(feeRoundingDifference),
          toAmount(feeTotalGross)
        ]
        // fallback only for the "transition" month
        : [null, null, null, toAmount(landingFeeTotal)];

      addAmounts(totals, amounts);

      return [
        toDateValue(date),
        dates.formatTime(date, time),
        immatriculation,
        mtow,
        firstname,
        lastname,
        email,
        getFlightTypeLabel(flightType),
        ...amounts
      ];
    });

    this.addTable(sheet, t('invoicesReport.landingFees'), this.landingFeeColumns(), rows, totals);
  }

  addCustomsFeesTable(sheet, customsDeclarations, cancelled) {
    const relevantDeclarations = customsDeclarations ? customsDeclarations
      .filter(declaration => cancelled ? declaration.cancelled === true : declaration.cancelled !== true)
      : [];

    if (relevantDeclarations.length === 0) {
      return;
    }

    const totals = [0, 0, 0, 0];

    const rows = relevantDeclarations.map(declaration => {
      const {date, direction, registration, email, fee} = declaration;

      const amounts = typeof fee === 'number'
        // fallback only for the "transition" month
        ? [null, null, null, toAmount(fee)]
        : [
          toAmount(fee && fee.totalNet),
          toAmount(fee && fee.vat),
          toAmount(fee && fee.roundingDifference),
          toAmount(fee && fee.totalGrossRounded)
        ];

      addAmounts(totals, amounts);

      return [
        toDateValue(date),
        registration,
        email,
        direction === 'arrival'
          ? t('invoicesReport.directionArrival')
          : t('invoicesReport.directionDeparture'),
        ...amounts
      ];
    });

    const subHeader = cancelled
      ? t('invoicesReport.customsFeesCancelled')
      : t('invoicesReport.customsFees');

    this.addTable(sheet, subHeader, this.customsFeeColumns(), rows, totals);
  }

  /**
   * Append a titled table to a sheet: a subheader, a bold header row, the data
   * rows, and a totals row of SUM formulas over just this table's rows.
   *
   * @param totals the JS sums, in order of the columns flagged `total`. They are
   *   written as each formula's cached result.
   */
  addTable(sheet, subHeader: string, columns: Column[], rows: any[][], totals: number[]) {
    sheet.addRow([]);

    const subHeaderRow = sheet.addRow([subHeader]);
    subHeaderRow.getCell(1).font = {bold: true, size: 12};

    const headerRow = sheet.addRow(columns.map(column => column.header));
    headerRow.font = {bold: true};

    const firstDataRowNumber = headerRow.number + 1;

    rows.forEach(values => {
      const row = sheet.addRow(values);
      columns.forEach((column, index) => {
        if (column.numFmt) {
          row.getCell(index + 1).numFmt = column.numFmt;
        }
      });
    });

    const lastDataRowNumber = firstDataRowNumber + rows.length - 1;

    const totalsRow = sheet.addRow([]);
    let totalIndex = 0;
    columns.forEach((column, index) => {
      if (!column.total) {
        return;
      }
      const letter = columnLetter(index + 1);
      const cell = totalsRow.getCell(index + 1);
      // The cached result keeps the total readable by tools that do not
      // evaluate formulas; without it they see an empty cell.
      cell.value = {
        formula: `SUM(${letter}${firstDataRowNumber}:${letter}${lastDataRowNumber})`,
        result: totals[totalIndex]
      };
      cell.numFmt = column.numFmt;
      cell.font = {bold: true};
      totalIndex++;
    });

    columns.forEach((column, index) => {
      const sheetColumn = sheet.getColumn(index + 1);
      if (!sheetColumn.width || sheetColumn.width < column.width) {
        sheetColumn.width = column.width;
      }
    });
  }
}

export default InvoicesExcelReport;
