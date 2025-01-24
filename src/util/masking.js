export function maskEmail(email) {
  if (!email) {
    return email
  }

  if (!email.includes('@')) {
    return maskText(email)
  }

  const [localPart, domain] = email.split('@')
  const maskedLocal = maskText(localPart)
  const [domainName, tld] = domain.split('.')
  const maskedDomain = maskText(domainName) + '.' + tld
  return `${maskedLocal}@${maskedDomain}`
}

export function maskPhone(phone) {
  if (!phone) {
    return phone
  }

  const visibleDigits = 2
  const maskedLength = phone.length - visibleDigits
  return '*'.repeat(maskedLength) + phone.slice(-visibleDigits)
}

export function maskText(text) {
  if (!text) {
    return text
  }

  return text[0] + '*'.repeat(text.length - 2) + text.slice(-1)
}
