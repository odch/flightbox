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
