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
          return '<p>{{signInCode}}</p><span>{{airportName}}</span><span>{{themeColor}}</span>';
        }
        return 'Code: {{signInCode}} for {{airportName}}';
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns subject, html, and text', () => {
      const result = getSignInEmailContent({
        signInCode: '123456',
        airportName: 'Thun Airport',
        themeColor: '#003863'
      });
      expect(result.subject).toBe('Bei Flightbox anmelden');
      expect(result.html).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('replaces signInCode placeholder in html', () => {
      const result = getSignInEmailContent({
        signInCode: '123456',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('123456');
      expect(result.html).not.toContain('{{signInCode}}');
    });

    it('replaces airportName placeholder in html', () => {
      const result = getSignInEmailContent({
        signInCode: '123456',
        airportName: 'Thun Airport',
        themeColor: '#003863'
      });
      expect(result.html).toContain('Thun Airport');
      expect(result.html).not.toContain('{{airportName}}');
    });

    it('replaces themeColor placeholder in html', () => {
      const result = getSignInEmailContent({
        signInCode: '123456',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('#003863');
      expect(result.html).not.toContain('{{themeColor}}');
    });

    it('replaces signInCode placeholder in text', () => {
      const result = getSignInEmailContent({
        signInCode: '123456',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.text).toContain('123456');
      expect(result.text).not.toContain('{{signInCode}}');
    });

    it('leaves unknown placeholders unchanged', () => {
      fs.readFileSync.mockReturnValue('{{unknownKey}} {{signInCode}}');
      const result = getSignInEmailContent({
        signInCode: '654321',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      expect(result.html).toContain('{{unknownKey}}');
      expect(result.html).toContain('654321');
    });

    it('reads html template from correct path', () => {
      getSignInEmailContent({
        signInCode: '123456',
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
        signInCode: '123456',
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
