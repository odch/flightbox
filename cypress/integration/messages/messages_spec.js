describe('messages', () => {
  describe('send message', () => {
    let createdMessageKey;

    before(() => {
      cy.visit('#/');
      cy.loginAdmin();
    });

    after(() => {
      if (createdMessageKey) {
        cy.window().then(win => {
          win.firebase.getRef(`/messages/${createdMessageKey}`).remove();
        });
      }
      cy.logout();
    });

    it('sends a message and verifies it was saved', () => {
      cy.visit('#/message');

      cy.get(`[data-cy=name]`).type('Max Muster');
      cy.get(`[data-cy=email]`).type('max@example.com');
      cy.get(`[data-cy=phone]`).type('0791234567');
      cy.get(`[data-cy=message]`).type('Test message from Cypress');

      cy.get(`[data-cy=send]`).click();

      cy.contains('Nachricht gesendet').should('be.visible');

      cy.window().then(win =>
        win.firebase.getRef('/messages').once('value').then(snapshot => {
          const messages = snapshot.val();
          expect(messages).to.not.be.null;

          const keys = Object.keys(messages);
          const messageKey = keys.find(k => messages[k].name === 'Max Muster');
          expect(messageKey).to.exist;

          createdMessageKey = messageKey;

          expect(messages[messageKey].email).to.equal('max@example.com');
          expect(messages[messageKey].phone).to.equal('0791234567');
          expect(messages[messageKey].message).to.equal('Test message from Cypress');
        })
      );
    });
  });
});
