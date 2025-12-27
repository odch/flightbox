describe('user', () => {
  describe('logout', () => {
    before(() => {
      cy.visit('#');
      cy.login();
    });

    after(() => {
      cy.logout();
    });

    it('logs out successfully', () => {
      cy.get('[data-cy=login-info]').click();
      cy.get('[data-cy=logout]').click();
      cy.get('[data-cy=login-form]').should('be.visible');
    });
  });
});
