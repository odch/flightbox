import firebase, {getIdToken} from './firebase.js';
import {firebaseToLocal} from './movements.js';
import dates from '../util/dates';
import {getLabel as getFlightTypeLabel} from '../util/flightTypes';
import formatMoney from './formatMoney'

import moment from 'moment';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

window.pdfFonts = pdfFonts; // actually not necessary, but otherwise `pdfFonts` is unused and would be removed

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
        this.readCustomsDeclarationsInvoices()
    ]).then(([arrivalsResult, customsInvoices]) => {
      this.build(arrivalsResult, customsInvoices, callback);
    });
  }

  readArrivals() {
    return new Promise(resolve => {
      firebase('/arrivals', (error, ref) => {
        ref.orderByChild('dateTime')
          .startAt(dates.isoStartOfDay(this.startDate))
          .endAt(dates.isoEndOfDay(this.endDate))
          .once('value', resolve, this);
      });
    });
  }

  async readCustomsDeclarationsInvoices() {
    const idToken = await getIdToken()
    const url = `https://us-central1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/customs/invoices?year=${this.year}&month=${this.month}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })

    if (!response.ok) {
      console.log('Failed to fetch customs invoices', response)
      throw new Error('Failed to fetch customs invoices')
    }

    return await response.json()
  }

  build(arrivals, customsInvoices, callback) {
    const content = this.buildContent(arrivals, customsInvoices)
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

  buildContent(arrivals, customsInvoices) {
    const filteredArrivals = this.filterArrivals(arrivals)
    const arrivalRecipients = this.groupArrivalsByRecipient(filteredArrivals)
    const customsRecipients = this.groupCustomsDeclarationsByRecipient(customsInvoices)

    const recipientNames = Array.from(new Set([
      ...Object.keys(arrivalRecipients),
      ...Object.keys(customsRecipients)
    ]))
    recipientNames.sort()

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
        this.addCustomsFeesTable(recipientName, customsRecipients[recipientName], content)
      }))

    if (content.length === 0) {
      content.push(`Keine Rechnungsempfänger im ausgewählten Zeitraum (${this.getMonthLabel()})`)
    }

    return content
  }

  filterArrivals(arrivals) {
    const filtered = []

    arrivals.forEach(record => {
      const arrival = firebaseToLocal(record.val());
      if (arrival.paymentMethod && arrival.paymentMethod.method === 'invoice') {
        filtered.push(arrival)
      }
    });

    return filtered
  }

  groupArrivalsByRecipient(arrivals) {
    const recipients = {}

    arrivals.forEach(arrival => {
      const invoiceRecipientName = arrival.paymentMethod.invoiceRecipientName

      if (!recipients[invoiceRecipientName]) {
        recipients[invoiceRecipientName] = []
      }

      recipients[invoiceRecipientName].push(arrival)
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
    const monthName = dates.monthNames[this.month - 1]
    return `${monthName} ${this.year}`
  }

  addLandingFeesTable(recipientName, arrivals, content) {
    if (!arrivals || arrivals.length === 0) {
      return
    }

    content.push({
      text: 'Landetaxen',
      style: 'subHeader'
    })

    let landingFeeSum = 0
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
        landingCount,
        landingFeeSingle,
        landingFeeTotal,
      } = arrival;

      rows.push([
        {text: dates.formatDate(date), alignment: 'right'},
        {text: dates.formatTime(date, time), alignment: 'right'},
        immatriculation,
        {text: mtow, alignment: 'right'},
        firstname,
        lastname,
        email,
        getFlightTypeLabel(flightType),
        {text: landingCount, alignment: 'right'},
        {text: formatMoney(landingFeeSingle), alignment: 'right'},
        {text: formatMoney(landingFeeTotal), alignment: 'right'}
      ])

      landingFeeSum += landingFeeTotal
    })

    rows.push([{colSpan: 10, text: ''}, '', '', '', '', '', '', '', '', '', {
      alignment: 'right',
      bold: true,
      text: formatMoney(landingFeeSum)
    }])

    const table = {
      table: {
        body: [
          [
            {text: 'Datum', bold: true, alignment: 'right'},
            {text: 'Uhrzeit', bold: true, alignment: 'right'},
            {text: 'Immatrikulation', bold: true},
            {text: 'MTOW', bold: true, alignment: 'right'},
            {text: 'Vorname', bold: true},
            {text: 'Nachname', bold: true},
            {text: 'E-Mail', bold: true},
            {text: 'Flugtyp', bold: true},
            {text: 'Anzahl Landungen', bold: true, alignment: 'right'},
            {text: 'Landegebühr einzel', bold: true, alignment: 'right'},
            {text: 'Landegebühr gesamt', bold: true, alignment: 'right'}
          ],
          ...rows
        ]
      },
      margin: [0, 10]
    }

    content.push(table)
  }

  addCustomsFeesTable(recipientName, customsDeclarations, content) {
    if (!customsDeclarations || customsDeclarations.length === 0) {
      return
    }

    content.push({
      text: 'Zollgebühren',
      style: 'subHeader'
    })

    let feeSum = 0
    const rows = []

    customsDeclarations.forEach(declaration => {
      const {
        created,
        date,
        direction,
        registration,
        email,
        fee,
      } = declaration;

      rows.push([
        {text: dates.formatDateTime(created), alignment: 'right'},
        {text: date, alignment: 'right'},
        registration,
        email,
        direction === 'arrival' ? 'Einflug' : 'Ausflug',
        {text: formatMoney(fee), alignment: 'right'}
      ])

      feeSum += fee
    })

    rows.push([{colSpan: 4, text: ''}, '', '', '', '', {
      alignment: 'right',
      bold: true,
      text: formatMoney(feeSum)
    }])

    const table = {
      table: {
        body: [
          [
            {text: 'Erfasst am', bold: true, alignment: 'right'},
            {text: 'Datum', bold: true, alignment: 'right'},
            {text: 'Immatrikulation', bold: true},
            {text: 'E-Mail', bold: true},
            {text: 'Einflug / Ausflug', bold: true},
            {text: 'Gebühr', bold: true, alignment: 'right'}
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
