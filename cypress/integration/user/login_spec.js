describe('user', () => {
  describe('login', () => {
    beforeEach(() => {
      cy.visit('#');
    });

    after(() => {
      cy.logout();
    });

    it('requires valid username and password', () => {
      cy.get('[data-cy=submit]').should('be.disabled');
      cy.get('form').submit();
      cy.get('form').should('contain', 'Login fehlgeschlagen');
    });

    it('logs in successfully', () => {
      cy.get('[data-cy=username]').type('foo');
      cy.get('[data-cy=password]').type('bar');
      cy.get('[data-cy=submit]').should('be.enabled').click();
      cy.get('[data-cy=login-info]').contains('foo');
    });
  });
});
