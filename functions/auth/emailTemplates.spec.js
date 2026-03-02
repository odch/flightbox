jest.mock('fs');
jest.mock('path', () => ({
  join: (...args) => args.join('/')
}));

const fs = require('fs');
const { getSignInEmailContent } = require('./emailTemplates');

describe('functions', () => {
  describe('auth/emailTemplates', () => {
    beforeEach(() => {
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.endsWith('.html')) {
          return '<a href="{{signInLink}}">{{airportName}}</a><span>{{themeColor}}</span>';
        }
        return 'Sign in at {{signInLink}} for {{airportName}}';
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns subject, html, and text', () => {
      const result = getSignInEmailContent({
        signInLink: 'https://example.com/signin',
        airportName: 'Thun Airport',
        themeColor: '#003863'
      });
      expect(result.subject).toBe('Bei Flightbox anmelden');
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('replaces signInLink placeholder in html', () => {
      const result = getSignInEmailContent({
        signInLink: 'https://example.com/signin',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('https://example.com/signin');
      expect(result.html).not.toContain('{{signInLink}}');
    });

    it('replaces airportName placeholder in html', () => {
      const result = getSignInEmailContent({
        signInLink: 'https://example.com/signin',
        airportName: 'Thun Airport',
        themeColor: '#003863'
      });
      expect(result.html).toContain('Thun Airport');
      expect(result.html).not.toContain('{{airportName}}');
    });

    it('replaces themeColor placeholder in html', () => {
      const result = getSignInEmailContent({
        signInLink: 'https://example.com/signin',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('#003863');
      expect(result.html).not.toContain('{{themeColor}}');
    });

    it('replaces signInLink placeholder in text', () => {
      const result = getSignInEmailContent({
        signInLink: 'https://example.com/signin',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.text).toContain('https://example.com/signin');
      expect(result.text).not.toContain('{{signInLink}}');
    });

    it('leaves unknown placeholders unchanged', () => {
      fs.readFileSync.mockReturnValue('{{unknownKey}} {{signInLink}}');
      const result = getSignInEmailContent({
        signInLink: 'https://example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('{{unknownKey}}');
      expect(result.html).toContain('https://example.com');
    });

    it('reads html template from correct path', () => {
      getSignInEmailContent({
        signInLink: 'https://example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('signin.html'),
        'utf8'
      );
    });

    it('reads text template from correct path', () => {
      getSignInEmailContent({
        signInLink: 'https://example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('signin.txt'),
        'utf8'
      );
    });
  });
});
