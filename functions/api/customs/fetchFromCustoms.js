
const fetchFromCustoms = async (firebase, urlBuilder) => {
  const snapshot = await firebase.ref('/settings/customsDeclarationApp').once('value')
  const customsSettings = snapshot.val()

  const url = urlBuilder(customsSettings)

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${customsSettings.accessToken}`,
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch invoices from customs app', response)
  }

  return await response.json()
}

module.exports.fetchInvoices = async (firebase, year, month) => {
  const body = await fetchFromCustoms(firebase, customsSettings => `${customsSettings.baseUrl}/api/invoices?ad=${customsSettings.aerodrome}&year=${year}&month=${month}`)
  return body.invoices
}

module.exports.fetchCheckouts = async (firebase, year, month) => {
  const body = await fetchFromCustoms(firebase, customsSettings => `${customsSettings.baseUrl}/api/checkouts?ad=${customsSettings.aerodrome}&year=${year}&month=${month}`)
  return body.checkouts
}
