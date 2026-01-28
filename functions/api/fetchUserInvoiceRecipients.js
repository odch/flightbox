'use strict';

const findInvoiceRecipients = (invoiceRecipients, authEmail) => {
  if (!invoiceRecipients || invoiceRecipients.length === 0) {
    return []
  }

  const matchingRecipients = []

  for (const invoiceRecipient of invoiceRecipients) {
    if (invoiceRecipient.emails && invoiceRecipient.emails.includes(authEmail)) {
      matchingRecipients.push(invoiceRecipient.name)
    }
  }

  return matchingRecipients
}

const fetchUserInvoiceRecipients = async (firebase, authEmail) => {
  if (!authEmail) {
    return []
  }
  const snapshot = await firebase.ref('/settings/invoiceRecipients')
    .once('value')
  const allRecipients = snapshot.val()
  return findInvoiceRecipients(allRecipients, authEmail)
}

module.exports = fetchUserInvoiceRecipients
