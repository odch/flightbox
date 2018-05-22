describe('user', () => {
  describe('logout', () => {
    beforeEach(() => {
      cy.login();
    });

    it('logs out successfully', () => {
      cy.get('[data-cy=logout]').click();
      cy.get('[data-cy=login-form]').should('be.visible');
    });
  });
});
