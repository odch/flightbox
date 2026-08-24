import InvoicesReportData from './InvoicesReportData';
import dates from '../util/dates';
import {getLabel as getFlightTypeLabel} from '../util/flightTypes';
import formatMoney from './formatMoney'
import i18n from '../i18n';

const t = i18n.getFixedT('de');

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(window as any).pdfFonts = pdfFonts; // actually not necessary, but otherwise `pdfFonts` is unused and would be removed

class InvoicesReport extends InvoicesReportData {

  generate(callback) {
    Promise.all([
        this.readArrivals(),
        this.readCustomsDeclarationsInvoices(),
        this.readCustomsDeclarationsCheckouts()
    ]).then(([arrivalsResult, customsInvoices, customsCheckouts]) => {
      this.build(arrivalsResult, customsInvoices, customsCheckouts, callback);
    });
  }

  build(arrivals, customsInvoices, customsCheckouts, callback) {
    const content = this.buildContent(arrivals, customsInvoices, customsCheckouts)
    const docDefinition = {
      pageOrientation: 'landscape',
      content,
      styles: {
        header: {fontSize: 18, bold: true, marginBottom: 10},
        subHeader: {fontSize: 14, bold: true},
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    const pdf = pdfMake.createPdf(docDefinition as any)

    callback(pdf)
  }

  buildContent(arrivals, customsInvoices, customsCheckouts) {
    const {arrivalRecipients, customsRecipients, recipientNames} =
      this.groupAll(arrivals, customsInvoices, customsCheckouts)

    const monthLabel = this.getMonthLabel()

    const content: any[] = []

    recipientNames
      .forEach(((recipientName, index) => {
        content.push({
          text: `${recipientName} (${monthLabel})`,
          style: 'header',
          pageBreak: index > 0 ? 'before' : undefined
        })

        this.addLandingFeesTable(recipientName, arrivalRecipients[recipientName], content)
        this.addCustomsFeesTable(recipientName, customsRecipients[recipientName], content, false)
        this.addCustomsFeesTable(recipientName, customsRecipients[recipientName], content, true)
      }))

    if (content.length === 0) {
      content.push(t('invoicesReport.noRecipients', { month: this.getMonthLabel() }))
    }

    return content
  }

  addLandingFeesTable(recipientName, arrivals, content) {
    if (!arrivals || arrivals.length === 0) {
      return
    }

    content.push({
      text: t('invoicesReport.landingFees'),
      style: 'subHeader'
    })

    let netFeeSum = 0
    let vatSum = 0
    let roundingDiffSum = 0
    let grossFeeSum = 0

    const rows: any[] = []

    arrivals.forEach(arrival => {
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

      let totalNetFormatted
      let vatFormatted
      let roundingDiffFormatted
      let totalGrossFormatted

      if (typeof feeTotalGross === 'number') {
        totalNetFormatted=formatMoney(feeTotalNet)
        vatFormatted = formatMoney(feeVat)
        roundingDiffFormatted = formatMoney(feeRoundingDifference)
        totalGrossFormatted = formatMoney(feeTotalGross)

        netFeeSum += feeTotalNet
        vatSum += feeVat
        roundingDiffSum += feeRoundingDifference
        grossFeeSum += feeTotalGross
      } else { // fallback only for the "transition" month
        totalGrossFormatted = formatMoney(landingFeeTotal)

        grossFeeSum += landingFeeTotal
      }

      rows.push([
        {text: dates.formatDate(date), alignment: 'right'},
        {text: dates.formatTime(date, time), alignment: 'right'},
        immatriculation,
        {text: mtow, alignment: 'right'},
        firstname,
        lastname,
        email,
        getFlightTypeLabel(flightType),
        {text: totalNetFormatted, alignment: 'right'},
        {text: vatFormatted, alignment: 'right'},
        {text: roundingDiffFormatted, alignment: 'right'},
        {text: totalGrossFormatted, alignment: 'right'}
      ])
    })

    rows.push([{colSpan: 8, text: ''}, '', '', '', '', '', '', '', {
      alignment: 'right',
      bold: true,
      text: formatMoney(netFeeSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(vatSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(roundingDiffSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(grossFeeSum)
    }])

    const table = {
      table: {
        body: [
          [
            {text: t('invoicesReport.colDate'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colTime'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colImmatriculation'), bold: true},
            {text: 'MTOW', bold: true, alignment: 'right'},
            {text: t('invoicesReport.colFirstname'), bold: true},
            {text: t('invoicesReport.colLastname'), bold: true},
            {text: t('invoicesReport.colEmail'), bold: true},
            {text: t('invoicesReport.colFlightType'), bold: true},
            {text: t('invoicesReport.colSubtotal'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colVat'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colRounding'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colTotal'), bold: true, alignment: 'right'}
          ],
          ...rows
        ]
      },
      margin: [0, 10]
    }

    content.push(table)
  }

  addCustomsFeesTable(recipientName, customsDeclarations, content, cancelled) {
    const relevantDeclarations = customsDeclarations ? customsDeclarations
      .filter(declaration => cancelled ? declaration.cancelled === true : declaration.cancelled !== true)
      : []

    if (relevantDeclarations.length === 0) {
      return
    }

    content.push({
      text: cancelled ? t('invoicesReport.customsFeesCancelled') : t('invoicesReport.customsFees'),
      style: 'subHeader'
    })

    let netFeeSum = 0
    let vatSum = 0
    let roundingDiffSum = 0
    let grossFeeSum = 0

    const rows: any[] = []

    relevantDeclarations.forEach(declaration => {
      const {
        date,
        direction,
        registration,
        email,
        fee,
      } = declaration;

      let totalNetFormatted
      let vatFormatted
      let roundingDiffFormatted
      let totalGrossFormatted

      if (typeof fee === 'number') {
        // fallback only for the "transition" month
        totalGrossFormatted = formatMoney(fee)

        grossFeeSum += fee
      } else {
        totalNetFormatted=formatMoney(fee.totalNet)
        vatFormatted = formatMoney(fee.vat)
        roundingDiffFormatted = formatMoney(fee.roundingDifference)
        totalGrossFormatted = formatMoney(fee.totalGrossRounded)

        netFeeSum += fee.totalNet
        vatSum += fee.vat
        roundingDiffSum += fee.roundingDifference
        grossFeeSum += fee.totalGrossRounded
      }

      rows.push([
        {text: date, alignment: 'right'},
        registration,
        email,
        direction === 'arrival' ? t('invoicesReport.directionArrival') : t('invoicesReport.directionDeparture'),
        {text: totalNetFormatted, alignment: 'right'},
        {text: vatFormatted, alignment: 'right'},
        {text: roundingDiffFormatted, alignment: 'right'},
        {text: totalGrossFormatted, alignment: 'right'}
      ])
    })

    rows.push([{colSpan: 3, text: ''}, '', '', '', {
      alignment: 'right',
      bold: true,
      text: formatMoney(netFeeSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(vatSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(roundingDiffSum)
    }, {
      alignment: 'right',
      bold: true,
      text: formatMoney(grossFeeSum)
    }])

    const table = {
      table: {
        body: [
          [
            {text: t('invoicesReport.colDate'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colImmatriculation'), bold: true},
            {text: t('invoicesReport.colEmail'), bold: true},
            {text: t('invoicesReport.colDirection'), bold: true},
            {text: t('invoicesReport.colSubtotal'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colVat'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colRounding'), bold: true, alignment: 'right'},
            {text: t('invoicesReport.colTotal'), bold: true, alignment: 'right'}
          ],
          ...rows
        ]
      },
      margin: [0, 10]
    }

    content.push(table)
  }
}

export default InvoicesReport;
