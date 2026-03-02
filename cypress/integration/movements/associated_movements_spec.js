// Tests write movements directly to Firebase (not via UI) to isolate trigger behavior.
// Cloud Function triggers are async, so cy.waitForAssociation polls until settled.
// See cypress/CYPRESS_TESTING_SETUP.md for required persistent DB data.

import dates from '../../../src/util/dates';

// Prevent Firebase permission/auth errors from triggering app-level redirects that
// would reset window.firebase between tests.
Cypress.on('uncaught:exception', () => false);

describe('associated movements', () => {
  const now = new Date();
  const base = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const dt = (offsetMinutes) => {
    const d = new Date(`${base}T00:00:00Z`);
    d.setMinutes(d.getMinutes() + offsetMinutes);
    return d.toISOString(); // YYYY-MM-DDTHH:mm:ss.mmmZ — matches Firebase rules
  };

  // Returns HH:mm in Europe/Zurich — a substring of the "HH:mm Uhr" the app renders.
  const zurichTime = (offsetMinutes) => dates.isoUtcToLocal(dt(offsetMinutes)).time;

  const minimalDeparture = (immatriculation, offsetMinutes) => {
    const dateTime = dt(offsetMinutes);
    return {
      immatriculation,
      dateTime,
      negativeTimestamp: -new Date(dateTime).getTime(),
      departureRoute: 'west',
      flightType: 'private',
      runway: '36',
      aircraftType: 'DR40',
      mtow: 1000,
      aircraftCategory: 'Flugzeug',
      duration: '01:00',
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'Pilot',
      location: 'LSZR'
    };
  };

  const minimalArrival = (immatriculation, offsetMinutes) => {
    const dateTime = dt(offsetMinutes);
    return {
      immatriculation,
      dateTime,
      negativeTimestamp: -new Date(dateTime).getTime(),
      arrivalRoute: 'west',
      flightType: 'private',
      runway: '36',
      aircraftType: 'DR40',
      mtow: 1000,
      aircraftCategory: 'Flugzeug',
      landingCount: 1,
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'Pilot',
      location: 'LSZR'
    };
  };

  // Helpers — all return Cypress chains
  const pushRef = (path, data) =>
    cy.window().then(win => win.firebase.getRef(path).push(data));

  const removeRef = (path) =>
    cy.window().then(win => win.firebase.getRef(path).remove());

  // Each scenario has its own before/after to guarantee a clean auth state.
  // cy.loginAdmin() is used for direct DB writes (full access).
  const setupAuth = () => {
    cy.visit('#/');
    cy.loginAdmin();
  };

  const teardownAuth = () => {
    cy.logout();
  };

  // Navigate to the movements list with a wide viewport so action button labels
  // (hidden via CSS at ≤1200px) are visible for assertions.
  const visitMovements = () => {
    cy.viewport(1400, 900);
    cy.visit('#/movements');
  };

  // -------------------------------------------------------------------------
  // Scenario 1: Homebase — departure + arrival link bidirectionally
  // -------------------------------------------------------------------------
  describe('homebase departure and arrival link bidirectionally', () => {
    let departureKey;
    let arrivalKey;

    before(setupAuth);
    after(teardownAuth);

    it('creates bidirectional association for homebase aircraft', () => {
      pushRef('/departures', minimalDeparture('HBKOF', 60)).then(ref => {
        departureKey = ref.key;
      });

      cy.then(() =>
        pushRef('/arrivals', minimalArrival('HBKOF', 120)).then(ref => {
          arrivalKey = ref.key;
        })
      );

      // Homebase departure (T+60) looks forward → arrival (T+120)
      cy.then(() =>
        cy.waitForAssociation('departure', departureKey).then(assoc => {
          expect(assoc.key).to.equal(arrivalKey);
          expect(assoc.type).to.equal('arrival');
        })
      );

      // Arrival looks backward → departure
      cy.then(() =>
        cy.waitForAssociation('arrival', arrivalKey).then(assoc => {
          expect(assoc.key).to.equal(departureKey);
          expect(assoc.type).to.equal('departure');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // Departure: linked — no "Ankunft erfassen" action button in the list row
        cy.get(`[data-id="${departureKey}"]`)
          .should('exist')
          .and('not.contain', 'Ankunft erfassen');

        // Expand departure: associated arrival section shows the arrival's landing time
        cy.get(`[data-id="${departureKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${departureKey}"]`).within(() => {
          cy.contains('Zugeordnete Ankunft').should('be.visible');
          cy.contains('Die folgende Ankunft wurde diesem Abflug automatisch zugeordnet:').should('be.visible');
          // Arrival landing time (T+120) identifies the correct partner
          cy.contains(zurichTime(120)).should('be.visible');
        });

        // Expand arrival (auto-collapses departure): associated departure section shows departure time
        cy.get(`[data-id="${arrivalKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${arrivalKey}"]`).within(() => {
          cy.contains('Zugeordneter Abflug').should('be.visible');
          cy.contains('Der folgende Abflug wurde dieser Ankunft automatisch zugeordnet:').should('be.visible');
          // Departure time (T+60) identifies the correct partner
          cy.contains(zurichTime(60)).should('be.visible');
        });
      });
    });

    afterEach(() => {
      if (departureKey) {
        removeRef(`/departures/${departureKey}`);
        departureKey = null;
      }
      if (arrivalKey) {
        removeRef(`/arrivals/${arrivalKey}`);
        arrivalKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 2: External — arrival + departure link bidirectionally
  // -------------------------------------------------------------------------
  describe('external aircraft arrival and departure link bidirectionally', () => {
    let departureKey;
    let arrivalKey;

    before(setupAuth);
    after(teardownAuth);

    it('creates bidirectional association for external aircraft', () => {
      pushRef('/arrivals', minimalArrival('DEXYZ', 60)).then(ref => {
        arrivalKey = ref.key;
      });

      cy.then(() =>
        pushRef('/departures', minimalDeparture('DEXYZ', 120)).then(ref => {
          departureKey = ref.key;
        })
      );

      // External arrival (T+60) looks forward → departure (T+120)
      cy.then(() =>
        cy.waitForAssociation('arrival', arrivalKey).then(assoc => {
          expect(assoc.key).to.equal(departureKey);
          expect(assoc.type).to.equal('departure');
        })
      );

      // External departure looks backward → arrival
      cy.then(() =>
        cy.waitForAssociation('departure', departureKey).then(assoc => {
          expect(assoc.key).to.equal(arrivalKey);
          expect(assoc.type).to.equal('arrival');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // Arrival: linked — no "Abflug erfassen" action button in the list row
        cy.get(`[data-id="${arrivalKey}"]`)
          .should('exist')
          .and('not.contain', 'Abflug erfassen');

        // Expand arrival: associated departure section shows the departure's takeoff time
        cy.get(`[data-id="${arrivalKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${arrivalKey}"]`).within(() => {
          cy.contains('Zugeordneter Abflug').should('be.visible');
          cy.contains('Der folgende Abflug wurde dieser Ankunft automatisch zugeordnet:').should('be.visible');
          // Departure time (T+120) identifies the correct partner
          cy.contains(zurichTime(120)).should('be.visible');
        });

        // Expand departure (auto-collapses arrival): associated arrival section shows arrival landing time
        cy.get(`[data-id="${departureKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${departureKey}"]`).within(() => {
          cy.contains('Zugeordnete Ankunft').should('be.visible');
          cy.contains('Die folgende Ankunft wurde diesem Abflug automatisch zugeordnet:').should('be.visible');
          // Arrival landing time (T+60) identifies the correct partner
          cy.contains(zurichTime(60)).should('be.visible');
        });
      });
    });

    afterEach(() => {
      if (departureKey) {
        removeRef(`/departures/${departureKey}`);
        departureKey = null;
      }
      if (arrivalKey) {
        removeRef(`/arrivals/${arrivalKey}`);
        arrivalKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Delete departure (homebase) → arrival association resets
  // -------------------------------------------------------------------------
  describe('delete homebase departure resets arrival association', () => {
    let departureKey;
    let arrivalKey;

    before(setupAuth);
    after(teardownAuth);

    it('arrival association becomes none after linked departure is deleted', () => {
      pushRef('/departures', minimalDeparture('HBKOF', 60)).then(ref => {
        departureKey = ref.key;
      });

      cy.then(() =>
        pushRef('/arrivals', minimalArrival('HBKOF', 120)).then(ref => {
          arrivalKey = ref.key;
        })
      );

      // Wait for initial bidirectional association
      cy.then(() =>
        cy.waitForAssociation('departure', departureKey).then(assoc => {
          expect(assoc.key).to.equal(arrivalKey);
        })
      );

      // Delete the departure
      cy.then(() => removeRef(`/departures/${departureKey}`));

      // Arrival association should reset to {type: 'none'}
      cy.then(() =>
        cy.waitForAssociation('arrival', arrivalKey, 'none').then(assoc => {
          expect(assoc.type).to.equal('none');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // Deleted departure is gone from the list
        cy.get(`[data-id="${departureKey}"]`).should('not.exist');

        // Surviving arrival: unlinked — "Abflug erfassen" action button appears
        cy.get(`[data-id="${arrivalKey}"]`)
          .should('exist')
          .and('contain', 'Abflug erfassen');
      });
    });

    afterEach(() => {
      if (departureKey) {
        removeRef(`/departures/${departureKey}`);
        departureKey = null;
      }
      if (arrivalKey) {
        removeRef(`/arrivals/${arrivalKey}`);
        arrivalKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Delete arrival (external) → departure association resets
  // -------------------------------------------------------------------------
  describe('delete external arrival resets departure association', () => {
    let departureKey;
    let arrivalKey;

    before(setupAuth);
    after(teardownAuth);

    it('departure association becomes none after linked arrival is deleted', () => {
      pushRef('/arrivals', minimalArrival('DEXYZ', 60)).then(ref => {
        arrivalKey = ref.key;
      });

      cy.then(() =>
        pushRef('/departures', minimalDeparture('DEXYZ', 120)).then(ref => {
          departureKey = ref.key;
        })
      );

      // Wait for initial bidirectional association
      cy.then(() =>
        cy.waitForAssociation('arrival', arrivalKey).then(assoc => {
          expect(assoc.key).to.equal(departureKey);
        })
      );

      // Delete the arrival
      cy.then(() => removeRef(`/arrivals/${arrivalKey}`));

      // Departure association should reset to {type: 'none'}
      cy.then(() =>
        cy.waitForAssociation('departure', departureKey, 'none').then(assoc => {
          expect(assoc.type).to.equal('none');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // Deleted arrival is gone from the list
        cy.get(`[data-id="${arrivalKey}"]`).should('not.exist');

        // Surviving departure: unlinked — "Ankunft erfassen" action button appears
        cy.get(`[data-id="${departureKey}"]`)
          .should('exist')
          .and('contain', 'Ankunft erfassen');
      });
    });

    afterEach(() => {
      if (departureKey) {
        removeRef(`/departures/${departureKey}`);
        departureKey = null;
      }
      if (arrivalKey) {
        removeRef(`/arrivals/${arrivalKey}`);
        arrivalKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 5: Circuit departure links to next circuit arrival
  // -------------------------------------------------------------------------
  describe('circuit departure links to matching circuit arrival', () => {
    let departureKey;
    let arrivalKey;

    before(setupAuth);
    after(teardownAuth);

    it('circuit departure and arrival link regardless of homebase status', () => {
      const circuitDep = {
        ...minimalDeparture('HBKOF', 60),
        departureRoute: 'circuits',
        location: 'LSXX'
      };
      const circuitArr = {
        ...minimalArrival('HBKOF', 90),
        arrivalRoute: 'circuits',
        location: 'LSXX'
      };

      pushRef('/departures', circuitDep).then(ref => {
        departureKey = ref.key;
      });

      cy.then(() =>
        pushRef('/arrivals', circuitArr).then(ref => {
          arrivalKey = ref.key;
        })
      );

      cy.then(() =>
        cy.waitForAssociation('departure', departureKey).then(assoc => {
          expect(assoc.key).to.equal(arrivalKey);
          expect(assoc.type).to.equal('arrival');
        })
      );

      cy.then(() =>
        cy.waitForAssociation('arrival', arrivalKey).then(assoc => {
          expect(assoc.key).to.equal(departureKey);
          expect(assoc.type).to.equal('departure');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // Circuit departure: linked — no "Ankunft erfassen" action button
        cy.get(`[data-id="${departureKey}"]`)
          .should('exist')
          .and('not.contain', 'Ankunft erfassen');

        cy.get(`[data-id="${departureKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${departureKey}"]`).within(() => {
          cy.contains('Zugeordnete Ankunft').should('be.visible');
          cy.contains('Die folgende Ankunft wurde diesem Abflug automatisch zugeordnet:').should('be.visible');
          // Arrival landing time (T+90) identifies the correct partner
          cy.contains(zurichTime(90)).should('be.visible');
        });

        // Circuit arrival: linked — no "Abflug erfassen" action button
        cy.get(`[data-id="${arrivalKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${arrivalKey}"]`).within(() => {
          cy.contains('Zugeordneter Abflug').should('be.visible');
          cy.contains('Der folgende Abflug wurde dieser Ankunft automatisch zugeordnet:').should('be.visible');
          // Departure time (T+60) identifies the correct partner
          cy.contains(zurichTime(60)).should('be.visible');
        });
      });
    });

    afterEach(() => {
      if (departureKey) {
        removeRef(`/departures/${departureKey}`);
        departureKey = null;
      }
      if (arrivalKey) {
        removeRef(`/arrivals/${arrivalKey}`);
        arrivalKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 6: Cascade — inserting a movement between an existing linked pair
  // -------------------------------------------------------------------------
  describe('cascade re-evaluation when inserting between a linked pair', () => {
    let depBKey; // T+60, homebase
    let arrAKey; // T+180, homebase
    let depDKey; // T+120, homebase, inserted between B and A

    before(setupAuth);
    after(teardownAuth);

    it('inserting departure D between B and A causes D to steal A and B to unlink', () => {
      // Write B (T+60) and A (T+180) and wait for B↔A to link
      pushRef('/departures', minimalDeparture('HBKOF', 60)).then(ref => {
        depBKey = ref.key;
      });

      cy.then(() =>
        pushRef('/arrivals', minimalArrival('HBKOF', 180)).then(ref => {
          arrAKey = ref.key;
        })
      );

      cy.then(() =>
        cy.waitForAssociation('departure', depBKey).then(assoc => {
          expect(assoc.key).to.equal(arrAKey);
        })
      );

      // Insert departure D at T+120 (between B and A)
      cy.then(() =>
        pushRef('/departures', minimalDeparture('HBKOF', 120)).then(ref => {
          depDKey = ref.key;
        })
      );

      // D (homebase dep at T+120) looks forward → A (next arrival at T+180)
      cy.then(() =>
        cy.waitForAssociation('departure', depDKey).then(assoc => {
          expect(assoc.key).to.equal(arrAKey);
          expect(assoc.type).to.equal('arrival');
        })
      );

      // A now points to D
      cy.then(() =>
        cy.waitForAssociation('arrival', arrAKey).then(assoc => {
          expect(assoc.key).to.equal(depDKey);
          expect(assoc.type).to.equal('departure');
        })
      );

      // B is now unlinked — cascade cleaned up its stale pointer to A
      cy.then(() =>
        cy.waitForAssociation('departure', depBKey, 'none').then(assoc => {
          expect(assoc.type).to.equal('none');
        })
      );

      // UI: navigate to movements list and assert rendered state
      visitMovements();

      cy.then(() => {
        // depD: linked to arrA — no "Ankunft erfassen" action button
        cy.get(`[data-id="${depDKey}"]`)
          .should('exist')
          .and('not.contain', 'Ankunft erfassen');

        cy.get(`[data-id="${depDKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${depDKey}"]`).within(() => {
          cy.contains('Zugeordnete Ankunft').should('be.visible');
          cy.contains('Die folgende Ankunft wurde diesem Abflug automatisch zugeordnet:').should('be.visible');
          // Arrival landing time (T+180) identifies the correct partner
          cy.contains(zurichTime(180)).should('be.visible');
        });

        // arrA: linked to depD — expand and confirm depD's departure time, not depB's (T+60)
        cy.get(`[data-id="${arrAKey}"]`).find('.immatriculation').click();
        cy.get(`[data-id="${arrAKey}"]`).within(() => {
          cy.contains('Zugeordneter Abflug').should('be.visible');
          cy.contains('Der folgende Abflug wurde dieser Ankunft automatisch zugeordnet:').should('be.visible');
          // depD's departure time is T+120; depB's is T+60 — proves cascade linked the right departure
          cy.contains(zurichTime(120)).should('be.visible');
        });

        // depB: unlinked (cascade) — "Ankunft erfassen" action button visible
        cy.get(`[data-id="${depBKey}"]`)
          .should('exist')
          .and('contain', 'Ankunft erfassen');
      });
    });

    afterEach(() => {
      if (depBKey) {
        removeRef(`/departures/${depBKey}`);
        depBKey = null;
      }
      if (arrAKey) {
        removeRef(`/arrivals/${arrAKey}`);
        arrAKey = null;
      }
      if (depDKey) {
        removeRef(`/departures/${depDKey}`);
        depDKey = null;
      }
      cy.wait(3000); // give onDelete Cloud Functions time to clean up /movementAssociations
    });
  });
});
