
const fetchInvoices = async (firebase, year, month) => {
  const snapshot = await firebase.ref('/settings/customsDeclarationApp').once('value')
  const customsSettings = snapshot.val()

  const url = `${customsSettings.baseUrl}/api/invoices?ad=${customsSettings.aerodrome}&year=${year}&month=${month}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${customsSettings.accessToken}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch invoices from customs app', response)
  }

  const body = await response.json()

  return body.invoices
}

module.exports = fetchInvoices
