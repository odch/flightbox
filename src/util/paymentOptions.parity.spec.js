// Parity: the movement API offers a pilot the same ways to pay the landing
// fee as the app's arrival wizard (functions/movements/domain/paymentOptions.js
// against src/util/paymentMethods.ts), for every project, kind of user,
// invoice recipients, home-base aircraft and fee.
const fs = require('fs');
const path = require('path');
const projects = require('../../projects');
const objectToArray = require('./objectToArray').default;
const { buildServerConfigFor } = require('../../tasks/generateServerConfig');
const { buildMovementPolicy } = require('../../functions/movements/domain/policy');
const { paymentOptions, paymentCaller } = require('../../functions/movements/domain/paymentOptions');
const { PAYMENT_METHODS, getSelectablePaymentMethods, isPaymentDue } = require('./paymentMethods');

const PROJECTS = fs.readdirSync(path.join(__dirname, '../../projects'))
  .filter(file => file.endsWith('.json') && file !== 'default.json')
  .map(file => file.replace(/\.json$/, ''))
  .sort();
const USERS = [
  ['a pilot (also through Claude)', { uid: 'u1', isKiosk: false, isGuest: false }, { kiosk: false, local: false }],
  ['the kiosk', { uid: 'kiosk', isKiosk: true, isGuest: false }, { kiosk: true, local: true }],
  ['the guest', { uid: 'guest', isKiosk: false, isGuest: true }, { kiosk: false, local: true }],
];
const RECIPIENTS = [[], ['Fluggruppe A'], ['Fluggruppe A', 'Firma B']];

// What the wizard lists (PaymentMethod.tsx): the selectable methods in the
// order of PAYMENT_METHODS, invoice once per recipient.
function clientOptions(selectable, recipients) {
  const options = PAYMENT_METHODS
    .filter(m => selectable.includes(m.value) && m.value !== 'invoice')
    .map(m => ({ method: m.value }));
  if (selectable.includes('invoice')) {
    recipients.forEach(name => options.push({ method: 'invoice', invoiceRecipientName: name }));
  }
  return options;
}

describe('payment options: API and app agree', () => {
  describe.each(PROJECTS)('%s', project => {
    const conf = projects.load(project);
    const policy = buildMovementPolicy(buildServerConfigFor(project, 'test'));

    it.each(USERS)('for %s', (_, actor, auth) => {
      for (const recipients of RECIPIENTS) {
        for (const isHomeBase of [false, true]) {
          for (const fee of [0, 30]) {
            const server = paymentOptions({
              arrival: { feeTotalGross: fee },
              policy,
              caller: paymentCaller(actor),
              isHomeBase,
              invoiceRecipientNames: recipients,
            });
            const due = isPaymentDue(isHomeBase, conf.homebasePayment === true, fee);
            const selectable = getSelectablePaymentMethods(objectToArray(conf.paymentMethods), auth, recipients);
            expect({ due: server.due, options: server.options })
              .toEqual({ due, options: due ? clientOptions(selectable, recipients) : [] });
          }
        }
      }
    });
  });
});
