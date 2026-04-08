describe('detectLanguage', () => {
  let detectLanguage: () => string;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
  });

  const loadDetectLanguage = () => {
    ({ detectLanguage } = require('./i18n'));
  };

  it('returns stored language from localStorage', () => {
    localStorage.setItem('flightbox_language', 'en');
    loadDetectLanguage();
    expect(detectLanguage()).toBe('en');
  });

  it('returns en for English browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('en');
  });

  it('returns en for en-GB browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-GB', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('en');
  });

  it('returns de for German browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'de-CH', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('de');
  });

  it('returns de for French browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'fr-CH', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('de');
  });

  it('returns de for Italian browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'it', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('de');
  });

  it('returns de when navigator.language is empty', () => {
    Object.defineProperty(navigator, 'language', { value: '', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('de');
  });

  it('localStorage takes precedence over browser language', () => {
    localStorage.setItem('flightbox_language', 'de');
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    loadDetectLanguage();
    expect(detectLanguage()).toBe('de');
  });
});
