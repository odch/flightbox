
const callCustomsApi = async (firebase, urlBuilder, options = {}) => {
  const snapshot = await firebase.ref('/settings/customsDeclarationApp').once('value')
  const customsSettings = snapshot.val()

  if (!customsSettings) {
    return null
  }

  const url = urlBuilder(customsSettings)

  const headers = {
    'Authorization': `Bearer ${customsSettings.accessToken}`,
  }

  if (options.method === 'POST') {
    headers['Content-Type'] = 'application/json'
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const method = options.method || 'GET'
    throw new Error(`Failed to ${method} to customs app: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

module.exports.fetchInvoices = async (firebase, year, month) => {
  const body = await callCustomsApi(firebase, customsSettings => `${customsSettings.baseUrl}/api/invoices?ad=${customsSettings.aerodrome}&year=${year}&month=${month}`)
  return body?.invoices || []
}

module.exports.fetchCheckouts = async (firebase, year, month) => {
  const body = await callCustomsApi(firebase, customsSettings => `${customsSettings.baseUrl}/api/checkouts?ad=${customsSettings.aerodrome}&year=${year}&month=${month}`)
  return body?.checkouts || []
}

module.exports.postPrepopulatedForm = async (firebase, formData) => {
  return await callCustomsApi(
    firebase,
    customsSettings => `${customsSettings.baseUrl}/api/prepopulated-forms`,
    { method: 'POST', body: formData }
  )
}

module.exports.isCustomsDeclarationAppAvailable = async (firebase) => {
  const snapshot = await firebase.ref('/settings/customsDeclarationApp').once('value')
  const customsSettings = snapshot.val()

  // Check if customs declaration app is properly configured
  return !!(customsSettings && customsSettings.accessToken && customsSettings.baseUrl && customsSettings.aerodrome)
}
