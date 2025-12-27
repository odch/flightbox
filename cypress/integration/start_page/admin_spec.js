describe('start_page', () => {
  describe('admin', () => {
    beforeEach(() => {
      cy.visit('#');
    });

    afterEach(() => {
      cy.logout();
    });

    it('has admin entry point if admin', () => {
      cy.loginAdmin();
      cy.get(`[data-cy=admin]`).click();
      cy.hash().should('eq', '#/admin');
    });

    it('has no admin entry point if not admin', () => {
      cy.login();
      cy.get('[data-cy=login-info]').contains('foo'); // wait for home screen to be loaded
      cy.get('[data-cy=admin]').should('not.exist');
    });
  });
});
