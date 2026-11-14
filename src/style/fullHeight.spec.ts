import fullHeight from './fullHeight';

const cssOf = (rules: ReturnType<typeof fullHeight>) => rules.join('').replace(/\s+/g, ' ').trim();

describe('style', () => {
  describe('fullHeight', () => {
    it('is the height of the screen with the toolbars of mobile browsers shown, else 100vh', () => {
      const text = cssOf(fullHeight());
      expect(text).toBe('min-height: calc(100vh - 0px); min-height: calc(100svh - 0px);');
    });

    it('takes an offset, e.g. for a header above', () => {
      expect(cssOf(fullHeight('60px'))).toContain('calc(100svh - 60px)');
      expect(cssOf(fullHeight('60px'))).toContain('calc(100vh - 60px)');
    });
  });
});
