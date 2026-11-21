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

// What the arrival wizard offers a user: the enabled methods, the card
// terminal only for local sign-ins, invoice only with invoice recipients.
// The movement API offers the same (functions/movements/domain/paymentOptions.js).
export const getSelectablePaymentMethods = (paymentMethods, auth, invoiceRecipients: string[]) =>
  getEnabledPaymentMethods(paymentMethods, auth)
    .filter((method: string) => method === 'card' ? auth.local === true : true)
    .filter((method: string) => method === 'invoice' ? invoiceRecipients.length > 0 : true)

// Whether the arrival wizard asks for payment: a fee is due and the aircraft
// is not a home-base or club aircraft, unless homebasePayment.
export const isPaymentDue = (isHomeBase: boolean, homebasePayment: boolean, totalGross?: number) =>
  (isHomeBase === false || homebasePayment === true) && !!totalGross && totalGross > 0

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
