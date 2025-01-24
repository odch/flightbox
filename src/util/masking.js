export function maskEmail(email) {
  if (!email) {
    return email
  }

  const [localPart, domain] = email.split('@')
  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1)
  const [domainName, tld] = domain.split('.')
  const maskedDomain = domainName[0] + '*'.repeat(domainName.length - 2) + domainName.slice(-1) + '.' + tld
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
