describe('util', () => {
  describe('loadExcelJs', () => {
    describe('resolveWorkbookConstructor', () => {
      let resolveWorkbookConstructor;

      beforeEach(() => {
        resolveWorkbookConstructor = require('./loadExcelJs').resolveWorkbookConstructor;
      });

      it('uses Workbook when it is exposed directly on the namespace', () => {
        class FakeWorkbook {}
        const result = resolveWorkbookConstructor({Workbook: FakeWorkbook, default: {}});
        expect(result).toBe(FakeWorkbook);
      });

      it('falls back to default.Workbook, as a raw ESM dynamic import exposes it', () => {
        class FakeWorkbook {}
        const result = resolveWorkbookConstructor({default: {Workbook: FakeWorkbook}});
        expect(result).toBe(FakeWorkbook);
      });
    });

    describe('default export', () => {
      it('resolves with the Workbook constructor from a real dynamic import', async () => {
        const loadWorkbookConstructor = require('./loadExcelJs').default;
        const Workbook = await loadWorkbookConstructor();
        expect(typeof Workbook).toBe('function');
        expect(new Workbook()).toBeInstanceOf(Workbook);
      });
    });
  });
});
