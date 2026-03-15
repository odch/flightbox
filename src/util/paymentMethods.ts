export const PAYMENT_METHODS = [
  { value: 'card' },
  { value: 'checkout' },
  { value: 'cash' },
  { value: 'card_external' },
  { value: 'twint_external' },
  { value: 'invoice' },
]

const AUTH_CONDITIONS = {
  kiosk: auth => auth.kiosk === true,
  notKiosk: auth => auth.kiosk !== true
}

export const getEnabledPaymentMethods = (paymentMethods, auth) => paymentMethods
  .filter(method => method.authCondition ? AUTH_CONDITIONS[method.authCondition](auth) : true)
  .map(method => typeof method === 'string' ? method : method.name)

export const getLabel = (value, t: (key: string) => string) => {
  const method = PAYMENT_METHODS.find(method => method.value === value.method)

  if (!method) {
    return value.method
  }

  const label = t(`paymentMethods.${method.value}`)

  if (method.value === 'invoice') {
    return `${label} (${value.invoiceRecipientName})`
  }

  return label
}
