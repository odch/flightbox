const { fetchInvoices, fetchCheckouts, postPrepopulatedForm, isCustomsDeclarationAppAvailable } = require('./fetchFromCustoms');

describe('functions', () => {
  describe('api/customs/fetchFromCustoms', () => {
    let firebase;
    let mockSnapshot;

    beforeEach(() => {
      mockSnapshot = { val: jest.fn() };
      firebase = {
        ref: jest.fn().mockReturnValue({
          once: jest.fn().mockResolvedValue(mockSnapshot)
        })
      };
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const customsSettings = {
      accessToken: 'token123',
      baseUrl: 'https://customs.example.com',
      aerodrome: 'LSZT'
    };

    describe('fetchInvoices', () => {
      it('returns empty array when no customs settings', async () => {
        mockSnapshot.val.mockReturnValue(null);
        const result = await fetchInvoices(firebase, 2024, 3);
        expect(result).toEqual([]);
      });

      it('returns invoices from customs app', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ invoices: [{ id: 1 }, { id: 2 }] })
        });

        const result = await fetchInvoices(firebase, 2024, 3);
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://customs.example.com/api/invoices?ad=LSZT&year=2024&month=3',
          expect.objectContaining({ method: 'GET' })
        );
      });

      it('returns empty array when body has no invoices field', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({})
        });

        const result = await fetchInvoices(firebase, 2024, 3);
        expect(result).toEqual([]);
      });

      it('throws when fetch response is not ok', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        global.fetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

        await expect(fetchInvoices(firebase, 2024, 3)).rejects.toThrow('Failed to GET to customs app');
      });
    });

    describe('fetchCheckouts', () => {
      it('returns empty array when no customs settings', async () => {
        mockSnapshot.val.mockReturnValue(null);
        const result = await fetchCheckouts(firebase, 2024, 3);
        expect(result).toEqual([]);
      });

      it('returns checkouts from customs app', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue({ checkouts: [{ id: 'c1' }] })
        });

        const result = await fetchCheckouts(firebase, 2024, 3);
        expect(result).toEqual([{ id: 'c1' }]);
      });

      it('returns empty array when body has no checkouts field', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(null)
        });

        const result = await fetchCheckouts(firebase, 2024, 3);
        expect(result).toEqual([]);
      });
    });

    describe('postPrepopulatedForm', () => {
      it('posts form data and returns response', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        const mockResponse = { id: 'form123' };
        global.fetch.mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        });

        const formData = { field: 'value' };
        const result = await postPrepopulatedForm(firebase, formData);

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://customs.example.com/api/prepopulated-forms',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' })
          })
        );
      });

      it('returns null when no customs settings', async () => {
        mockSnapshot.val.mockReturnValue(null);
        const result = await postPrepopulatedForm(firebase, {});
        expect(result).toBeNull();
      });
    });

    describe('isCustomsDeclarationAppAvailable', () => {
      it('returns true when all settings are present', async () => {
        mockSnapshot.val.mockReturnValue(customsSettings);
        const result = await isCustomsDeclarationAppAvailable(firebase);
        expect(result).toBe(true);
      });

      it('returns false when no settings', async () => {
        mockSnapshot.val.mockReturnValue(null);
        const result = await isCustomsDeclarationAppAvailable(firebase);
        expect(result).toBe(false);
      });

      it('returns false when accessToken missing', async () => {
        mockSnapshot.val.mockReturnValue({ baseUrl: 'https://example.com', aerodrome: 'LSZT' });
        const result = await isCustomsDeclarationAppAvailable(firebase);
        expect(result).toBe(false);
      });

      it('returns false when baseUrl missing', async () => {
        mockSnapshot.val.mockReturnValue({ accessToken: 'token', aerodrome: 'LSZT' });
        const result = await isCustomsDeclarationAppAvailable(firebase);
        expect(result).toBe(false);
      });
    });
  });
});
