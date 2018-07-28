describe('start_page', () => {
  describe('entry_points', () => {
    before(() => {
      cy.visit('#');
      cy.login();
    });

    after(() => {
      cy.logout();
    });

    beforeEach(() => {
      cy.visit('#');
    });

    const expectLinkClick = (identifier, hash) => {
      cy.get(`[data-cy=${identifier}]`).click();
      cy.hash().should('eq', hash);
    };

    it('should switch to new departure url', () => {
      expectLinkClick('new-departure', '#/departure/new');
    });

    it('should switch to new arrival url', () => {
      expectLinkClick('new-arrival', '#/arrival/new');
    });

    it('should switch to movements url', () => {
      expectLinkClick('movements', '#/movements')
    });

    it('should switch to message url', () => {
      expectLinkClick('message', '#/message')
    });

    it('should switch to help url', () => {
      expectLinkClick('help', '#/help')
    });
  });
});
