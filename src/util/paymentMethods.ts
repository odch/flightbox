export const PAYMENT_METHODS = [
  {
    label: 'Karte',
    value: 'card'
  },
  {
    ctaLabel: 'Direkt zahlen',
    label: 'Online-Zahlung',
    value: 'checkout'
  },
  {
    label: 'Bar',
    value: 'cash'
  },
  {
    label: 'Karte',
    value: 'card_external'
  },
  {
    label: 'Twint',
    value: 'twint_external'
  },
  {
    label: 'Rechnung',
    value: 'invoice'
  }
]

const AUTH_CONDITIONS = {
  kiosk: auth => auth.kiosk === true,
  notKiosk: auth => auth.kiosk !== true
}

export const getEnabledPaymentMethods = (paymentMethods, auth) => paymentMethods
  .filter(method => method.authCondition ? AUTH_CONDITIONS[method.authCondition](auth) : true)
  .map(method => typeof method === 'string' ? method : method.name)

export const getLabel = (value) => {
  const method = PAYMENT_METHODS.find(method => method.value === value.method)

  if (!method) {
    return value.method
  }

  if (method.value === 'invoice') {
    return `${method.label} (${value.invoiceRecipientName})`
  }

  return method.label
}
