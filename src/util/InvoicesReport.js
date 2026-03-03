import firebase, {getIdToken} from './firebase.js';
import {get, query, orderByChild, startAt, endAt} from 'firebase/database';
import {firebaseToLocal} from './movements';
import dates from '../util/dates';
import {getLabel as getFlightTypeLabel} from '../util/flightTypes';
import formatMoney from './formatMoney'
import i18n from '../i18n';

import moment from 'moment';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

window.pdfFonts = pdfFonts; // actually not necessary, but otherwise `pdfFonts` is unused and would be removed

const CHECKOUT_RECIPIENT_NAME = i18n.t('invoicesReport.onlinePayments')

class InvoicesReport {

  constructor(year, month, options = {}) {
    const monthStr = (month < 10 ? '0' : '') + month
    const day = '01';

    this.year = year
    this.month = month

    this.startDate = year + '-' + monthStr + '-' + day;
    this.endDate = moment(this.startDate).endOf('month').format('YYYY-MM-DD');

    this.creationDate = moment();

    this.options = options;
  }

  generate(callback) {
    Promise.all([
        this.readArrivals(),
        this.readCustomsDeclarationsInvoices(),
        this.readCustomsDeclarationsCheckouts()
    ]).then(([arrivalsResult, customsInvoices, customsCheckouts]) => {
      this.build(arrivalsResult, customsInvoices, customsCheckouts, callback);
    });
  }

  readArrivals() {
    return get(query(
      firebase('/arrivals'),
      orderByChild('dateTime'),
      startAt(dates.isoStartOfDay(this.startDate)),
      endAt(dates.isoEndOfDay(this.endDate))
    ));
  }

  async fetchCustomsData(endpoint) {
    const idToken = await getIdToken()
    const url = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/customs/${endpoint}?year=${this.year}&month=${this.month}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })

    if (!response.ok) {
      console.log(`Failed to fetch customs ${endpoint}`, response)
      throw new Error(`Failed to fetch customs ${endpoint}`)
    }

    return await response.json()
  }

  async readCustomsDeclarationsInvoices() {
    return this.fetchCustomsData('invoices')
  }

  async readCustomsDeclarationsCheckouts() {
    return this.fetchCustomsData('checkouts')
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

    const pdf = pdfMake.createPdf(docDefinition)

    callback(pdf)
  }

  buildContent(arrivals, customsInvoices, customsCheckouts) {
    const filteredArrivals = this.filterArrivals(arrivals)
    const arrivalRecipients = this.groupArrivalsByRecipient(filteredArrivals)
    const customsRecipients = this.groupCustomsDeclarationsByRecipient(customsInvoices)

    customsRecipients[CHECKOUT_RECIPIENT_NAME] = customsCheckouts

    let recipientNames = Array.from(new Set([
      ...Object.keys(arrivalRecipients),
      ...Object.keys(customsRecipients)
    ]))

    // sort names, but CHECKOUT_RECIPIENT_NAME should always be the first
    recipientNames = recipientNames.filter(name => name !== CHECKOUT_RECIPIENT_NAME)
    recipientNames.sort()
    recipientNames.unshift(CHECKOUT_RECIPIENT_NAME)

    const monthLabel = this.getMonthLabel()

    const content = []

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
      content.push(i18n.t('invoicesReport.noRecipients', { month: this.getMonthLabel() }))
    }

    return content
  }

  filterArrivals(arrivals) {
    const filtered = []

    arrivals.forEach(record => {
      const arrival = firebaseToLocal(record.val());
      if (arrival.paymentMethod && arrival.paymentMethod.status !== 'pending') {
        filtered.push(arrival)
      }
    });

    return filtered
  }

  groupArrivalsByRecipient(arrivals) {
    const recipients = {}

    arrivals.forEach(arrival => {
      const invoiceRecipientName = arrival.paymentMethod.method === 'invoice'
        ? arrival.paymentMethod.invoiceRecipientName
        : arrival.paymentMethod.method === 'checkout'
          ? CHECKOUT_RECIPIENT_NAME
          : undefined

      if (invoiceRecipientName) {
        if (!recipients[invoiceRecipientName]) {
          recipients[invoiceRecipientName] = []
        }

        recipients[invoiceRecipientName].push(arrival)
      }
    });

    return recipients
  }

  groupCustomsDeclarationsByRecipient(customsDeclarations) {
    const recipients = {}

    customsDeclarations.forEach(customsDeclaration => {
      const invoiceRecipientName = customsDeclaration.invoiceRecipientName

      if (!recipients[invoiceRecipientName]) {
        recipients[invoiceRecipientName] = []
      }

      recipients[invoiceRecipientName].push(customsDeclaration)
    });

    return recipients
  }

  getMonthLabel() {
    const monthName = i18n.t(`months.${this.month - 1}`)
    return `${monthName} ${this.year}`
  }

  addLandingFeesTable(recipientName, arrivals, content) {
    if (!arrivals || arrivals.length === 0) {
      return
    }

    content.push({
      text: i18n.t('invoicesReport.landingFees'),
      style: 'subHeader'
    })

    let netFeeSum = 0
    let vatSum = 0
    let roundingDiffSum = 0
    let grossFeeSum = 0

    const rows = []

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
            {text: i18n.t('invoicesReport.colDate'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colTime'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colImmatriculation'), bold: true},
            {text: 'MTOW', bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colFirstname'), bold: true},
            {text: i18n.t('invoicesReport.colLastname'), bold: true},
            {text: i18n.t('invoicesReport.colEmail'), bold: true},
            {text: i18n.t('invoicesReport.colFlightType'), bold: true},
            {text: i18n.t('invoicesReport.colSubtotal'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colVat'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colRounding'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colTotal'), bold: true, alignment: 'right'}
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
      text: cancelled ? i18n.t('invoicesReport.customsFeesCancelled') : i18n.t('invoicesReport.customsFees'),
      style: 'subHeader'
    })

    let netFeeSum = 0
    let vatSum = 0
    let roundingDiffSum = 0
    let grossFeeSum = 0

    const rows = []

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
        direction === 'arrival' ? i18n.t('invoicesReport.directionArrival') : i18n.t('invoicesReport.directionDeparture'),
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
            {text: i18n.t('invoicesReport.colDate'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colImmatriculation'), bold: true},
            {text: i18n.t('invoicesReport.colEmail'), bold: true},
            {text: i18n.t('invoicesReport.colDirection'), bold: true},
            {text: i18n.t('invoicesReport.colSubtotal'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colVat'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colRounding'), bold: true, alignment: 'right'},
            {text: i18n.t('invoicesReport.colTotal'), bold: true, alignment: 'right'}
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
