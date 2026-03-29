'use strict';

const fetchUserInvoiceRecipients = require('./fetchUserInvoiceRecipients');

describe('functions/api/fetchUserInvoiceRecipients', () => {
  const makeFirebase = (val) => ({
    ref: jest.fn().mockReturnValue({
      once: jest.fn().mockResolvedValue({ val: () => val }),
    }),
  });

  it('returns empty array when authEmail is falsy', async () => {
    const firebase = makeFirebase(null);
    expect(await fetchUserInvoiceRecipients(firebase, null)).toEqual([]);
    expect(await fetchUserInvoiceRecipients(firebase, '')).toEqual([]);
    expect(firebase.ref).not.toHaveBeenCalled();
  });

  it('returns empty array when no invoice recipients exist in db', async () => {
    const firebase = makeFirebase(null);
    const result = await fetchUserInvoiceRecipients(firebase, 'user@example.com');
    expect(result).toEqual([]);
  });

  it('returns recipient names matching the authEmail', async () => {
    const firebase = makeFirebase([
      { name: 'Recipient A', emails: ['user@example.com', 'other@example.com'] },
      { name: 'Recipient B', emails: ['other@example.com'] },
      { name: 'Recipient C', emails: ['user@example.com'] },
    ]);
    const result = await fetchUserInvoiceRecipients(firebase, 'user@example.com');
    expect(result).toEqual(['Recipient A', 'Recipient C']);
  });

  it('returns empty array when no recipient matches authEmail', async () => {
    const firebase = makeFirebase([
      { name: 'Recipient A', emails: ['other@example.com'] },
    ]);
    const result = await fetchUserInvoiceRecipients(firebase, 'user@example.com');
    expect(result).toEqual([]);
  });

  it('handles recipients without emails field', async () => {
    const firebase = makeFirebase([
      { name: 'Recipient A' },
      { name: 'Recipient B', emails: ['user@example.com'] },
    ]);
    const result = await fetchUserInvoiceRecipients(firebase, 'user@example.com');
    expect(result).toEqual(['Recipient B']);
  });

  it('queries /settings/invoiceRecipients ref', async () => {
    const mockRef = { once: jest.fn().mockResolvedValue({ val: () => null }) };
    const firebase = { ref: jest.fn().mockReturnValue(mockRef) };
    await fetchUserInvoiceRecipients(firebase, 'user@example.com');
    expect(firebase.ref).toHaveBeenCalledWith('/settings/invoiceRecipients');
  });
});
