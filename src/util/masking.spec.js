import {maskEmail, maskPhone, maskText} from './masking';

describe('util', () => {
  describe('masking', () => {
    describe('maskText', () => {
      it('returns null/falsy as-is', () => {
        expect(maskText(null)).toBeNull();
        expect(maskText('')).toBe('');
        expect(maskText(undefined)).toBeUndefined();
      });

      it('masks short text (< 3 chars) as all stars', () => {
        expect(maskText('a')).toBe('*');
        expect(maskText('ab')).toBe('**');
      });

      it('masks normal text keeping first and last character', () => {
        expect(maskText('hello')).toBe('h***o');
        expect(maskText('abc')).toBe('a*c');
      });
    });

    describe('maskEmail', () => {
      it('returns null/falsy as-is', () => {
        expect(maskEmail(null)).toBeNull();
        expect(maskEmail('')).toBe('');
      });

      it('masks plain text without @ as maskText', () => {
        expect(maskEmail('hello')).toBe('h***o');
      });

      it('masks email with local part and domain', () => {
        const result = maskEmail('john@example.com');
        expect(result).toContain('@');
        const [local, domain] = result.split('@');
        expect(local).toBe('j**n');
        expect(domain).toMatch(/\*/);
      });

      it('handles short local part', () => {
        const result = maskEmail('ab@example.com');
        expect(result).toContain('@');
        expect(result.split('@')[0]).toBe('**');
      });
    });

    describe('maskPhone', () => {
      it('returns null/falsy as-is', () => {
        expect(maskPhone(null)).toBeNull();
        expect(maskPhone('')).toBe('');
      });

      it('masks phone showing only last 2 digits', () => {
        expect(maskPhone('0791234567')).toBe('********67');
      });

      it('masks short phone number', () => {
        expect(maskPhone('1234')).toBe('**34');
      });
    });
  });
});
