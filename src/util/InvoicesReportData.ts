import firebase, {getIdToken} from './firebase';
import {get, query, orderByChild, startAt, endAt} from 'firebase/database';
import {firebaseToLocal} from './movements';
import dates from '../util/dates';
import i18n from '../i18n';

const t = i18n.getFixedT('de');

import moment from 'moment';

/**
 * Everything the invoice recipient reports need before rendering: fetching the
 * arrivals and customs declarations for a month, and grouping them by invoice
 * recipient. Rendering is left to the subclasses (PDF / Excel), so both formats
 * are guaranteed to show the same data in the same order.
 */
class InvoicesReportData {

  get checkoutRecipientName() {
    return t('invoicesReport.onlinePayments');
  }

  get cashRecipientName() {
    return t('invoicesReport.cashPayments');
  }

  year: number;
  month: number;
  startDate: string;
  endDate: string;
  creationDate: any;
  options: any;

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

  /**
   * Fetch the month's data and group it by invoice recipient.
   */
  collect() {
    return Promise.all([
      this.readArrivals(),
      this.readCustomsDeclarationsInvoices(),
      this.readCustomsDeclarationsCheckouts()
    ]).then(([arrivalsResult, customsInvoices, customsCheckouts]) =>
      this.groupAll(arrivalsResult, customsInvoices, customsCheckouts))
  }

  /**
   * Group already fetched data by invoice recipient, in display order.
   */
  groupAll(arrivals, customsInvoices, customsCheckouts) {
    const arrivalRecipients = this.groupArrivalsByRecipient(this.filterArrivals(arrivals))
    const customsRecipients = this.groupCustomsDeclarationsByRecipient(customsInvoices)

    customsRecipients[this.checkoutRecipientName] = customsCheckouts

    return {
      arrivalRecipients,
      customsRecipients,
      recipientNames: this.getRecipientNames(arrivalRecipients, customsRecipients)
    }
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

  filterArrivals(arrivals) {
    const filtered: any[] = []

    arrivals.forEach(record => {
      const arrival = firebaseToLocal(record.val());
      if (arrival.paymentMethod && arrival.paymentMethod.status !== 'pending') {
        filtered.push(arrival)
      }
    });

    return filtered
  }

  groupArrivalsByRecipient(arrivals) {
    // Null-prototype: invoiceRecipientName is user-controlled, so a value like
    // '__proto__' or 'constructor' must be an ordinary key, not touch the
    // prototype chain (which would corrupt grouping / crash the report).
    const recipients = Object.create(null)

    arrivals.forEach(arrival => {
      const invoiceRecipientName = arrival.paymentMethod.method === 'invoice'
        ? arrival.paymentMethod.invoiceRecipientName
        : arrival.paymentMethod.method === 'checkout'
          ? this.checkoutRecipientName
          : arrival.paymentMethod.method === 'cash'
            ? this.cashRecipientName
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
    // Null-prototype: invoiceRecipientName is user-controlled, so a value like
    // '__proto__' or 'constructor' must be an ordinary key, not touch the
    // prototype chain (which would corrupt grouping / crash the report).
    const recipients = Object.create(null)

    customsDeclarations.forEach(customsDeclaration => {
      const invoiceRecipientName = customsDeclaration.invoiceRecipientName

      if (!recipients[invoiceRecipientName]) {
        recipients[invoiceRecipientName] = []
      }

      recipients[invoiceRecipientName].push(customsDeclaration)
    });

    return recipients
  }

  /**
   * Recipient names in display order: online payments first, cash payments
   * second (when present), everything else alphabetically.
   */
  getRecipientNames(arrivalRecipients, customsRecipients) {
    let recipientNames = Array.from(new Set([
      ...Object.keys(arrivalRecipients),
      ...Object.keys(customsRecipients)
    ]))

    const hasCash = arrivalRecipients[this.cashRecipientName] !== undefined
    recipientNames = recipientNames.filter(
      name => name !== this.checkoutRecipientName && name !== this.cashRecipientName
    )
    recipientNames.sort()
    if (hasCash) {
      recipientNames.unshift(this.cashRecipientName)
    }
    recipientNames.unshift(this.checkoutRecipientName)

    return recipientNames
  }

  getMonthLabel() {
    const monthName = t(`months.${this.month - 1}`)
    return `${monthName} ${this.year}`
  }
}

export default InvoicesReportData;
