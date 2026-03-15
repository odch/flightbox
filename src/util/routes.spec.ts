describe('util', () => {
  describe('routes', () => {
    let getDepartureRoutes;
    let getArrivalRoutes;
    let getDepartureRouteLabel;
    let getArrivalRouteLabel;

    beforeEach(() => {
      jest.resetModules();

      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          departureRoutes: {
            0: { name: 'north', label: 'Nord' },
            1: { name: 'south', label: 'Süd' },
          },
          arrivalRoutes: {
            0: { name: 'east', label: 'Ost' },
          },
        },
      };

      const routes = require('./routes');
      getDepartureRoutes = routes.getDepartureRoutes;
      getArrivalRoutes = routes.getArrivalRoutes;
      getDepartureRouteLabel = routes.getDepartureRouteLabel;
      getArrivalRouteLabel = routes.getArrivalRouteLabel;
    });

    describe('getDepartureRoutes', () => {
      it('returns departure routes including circuit route', () => {
        const routes = getDepartureRoutes();
        expect(routes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'north', label: 'Nord' }),
            expect.objectContaining({ value: 'south', label: 'Süd' }),
            expect.objectContaining({ value: 'circuits', label: 'Platzrunden' }),
          ])
        );
      });

      it('includes the circuit route at the end', () => {
        const routes = getDepartureRoutes();
        const last = routes[routes.length - 1];
        expect(last.value).toBe('circuits');
      });

      it('returns all configured departure routes plus circuit', () => {
        const routes = getDepartureRoutes();
        expect(routes.length).toBe(3);
      });
    });

    describe('getArrivalRoutes', () => {
      it('returns arrival routes including circuit route', () => {
        const routes = getArrivalRoutes();
        expect(routes).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'east', label: 'Ost' }),
            expect.objectContaining({ value: 'circuits', label: 'Platzrunden' }),
          ])
        );
      });

      it('returns all configured arrival routes plus circuit', () => {
        const routes = getArrivalRoutes();
        expect(routes.length).toBe(2);
      });
    });

    describe('getDepartureRouteLabel', () => {
      it('returns label for a known departure route', () => {
        expect(getDepartureRouteLabel('north')).toBe('Nord');
      });

      it('returns label for south route', () => {
        expect(getDepartureRouteLabel('south')).toBe('Süd');
      });

      it('returns label for circuits route', () => {
        expect(getDepartureRouteLabel('circuits')).toBe('Platzrunden');
      });

      it('returns capitalized value for unknown route', () => {
        const label = getDepartureRouteLabel('unknown');
        expect(label).toBe('Unknown');
      });
    });

    describe('getArrivalRouteLabel', () => {
      it('returns label for a known arrival route', () => {
        expect(getArrivalRouteLabel('east')).toBe('Ost');
      });

      it('returns label for circuits route', () => {
        expect(getArrivalRouteLabel('circuits')).toBe('Platzrunden');
      });

      it('returns capitalized value for unknown route', () => {
        const label = getArrivalRouteLabel('mystery');
        expect(label).toBe('Mystery');
      });
    });

    describe('route available function', () => {
      it('circuit route is available when location matches aerodrome ICAO', () => {
        const routes = getDepartureRoutes();
        const circuit = routes.find(r => r.value === 'circuits');
        expect(circuit.available({ location: 'LSZT' })).toBe(true);
      });

      it('circuit route is not available when location does not match', () => {
        const routes = getDepartureRoutes();
        const circuit = routes.find(r => r.value === 'circuits');
        expect(circuit.available({ location: 'LSZB' })).toBe(false);
      });

      it('circuit route is not available when location is undefined', () => {
        const routes = getDepartureRoutes();
        const circuit = routes.find(r => r.value === 'circuits');
        expect(circuit.available({})).toBeFalsy();
      });
    });
  });

  describe('routes with condition', () => {
    let getDepartureRoutes;

    beforeEach(() => {
      jest.resetModules();

      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          departureRoutes: {
            0: { name: 'helipad', label: 'Helipad', condition: 'helicopter' },
            1: { name: 'runway', label: 'Runway', condition: 'notHelicopter' },
          },
          arrivalRoutes: {
            0: { name: 'east', label: 'Ost' },
          },
        },
      };

      const routes = require('./routes');
      getDepartureRoutes = routes.getDepartureRoutes;
    });

    it('helicopter condition returns true for helicopter registration', () => {
      const routes = getDepartureRoutes();
      const helipad = routes.find(r => r.value === 'helipad');
      expect(helipad.available).toBeDefined();
      expect(helipad.available({ immatriculation: 'HBXAB', aircraftCategory: null })).toBe(true);
    });

    it('notHelicopter condition returns false for helicopter', () => {
      const routes = getDepartureRoutes();
      const runway = routes.find(r => r.value === 'runway');
      expect(runway.available({ immatriculation: 'HBXAB', aircraftCategory: null })).toBe(false);
    });

    it('notHelicopter condition returns true for non-helicopter', () => {
      const routes = getDepartureRoutes();
      const runway = routes.find(r => r.value === 'runway');
      expect(runway.available({ immatriculation: 'HB-ABC', aircraftCategory: null })).toBe(true);
    });
  });
});
