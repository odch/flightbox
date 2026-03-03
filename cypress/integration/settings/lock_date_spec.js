describe('settings', () => {
  describe('lock_date', () => {
    before(() => {
      cy.visit('#/');
      cy.loginAdmin();
    });

    after(() => {
      cy.window().then(win => {
        win.firebase.getRef('/settings/lockDate').remove();
      });
      cy.logout();
    });

    it('sets and clears the lock date', () => {
      cy.visit('#/admin');

      cy.get(`[data-cy=lock-movements]`).click();

      cy.get(`[data-cy=lock-date]`).click();
      cy.get(`.DayPicker-Day[aria-disabled=false]`).first().click();

      cy.window().then(win =>
        win.firebase.getRef('/settings/lockDate').once('value').then(snapshot => {
          expect(snapshot.val()).to.not.be.null;
        })
      );

      cy.get(`[data-cy=lock-date]`).find('button[type=button]').click();

      cy.window().then(win =>
        win.firebase.getRef('/settings/lockDate').once('value').then(snapshot => {
          expect(snapshot.val()).to.be.null;
        })
      );
    });
  });
});
