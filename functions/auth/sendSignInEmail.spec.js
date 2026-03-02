describe('functions', () => {
  describe('auth/sendSignInEmail', () => {
    let mockAdmin;
    let mockFunctions;
    let mockNodemailer;
    let mockEmailTemplates;
    let capturedHandler;
    let mockCors;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      const mockOnce = jest.fn().mockResolvedValue({
        val: () => ({
          host: 'smtp.example.com',
          port: '587',
          user: 'user@example.com',
          password: 'secret',
          fromEmail: 'noreply@example.com',
          fromName: 'Flightbox'
        })
      });

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue({ once: mockOnce })
        })
      };

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockFunctions = {
        https: {
          onRequest: jest.fn().mockImplementation(handler => { capturedHandler = handler; })
        }
      };

      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg123' });
      const mockTransporter = { sendMail: mockSendMail };

      mockNodemailer = {
        createTransport: jest.fn().mockReturnValue(mockTransporter)
      };

      mockEmailTemplates = {
        getSignInEmailContent: jest.fn().mockReturnValue({
          subject: 'Sign in',
          html: '<p>Click here</p>',
          text: 'Click here'
        })
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions', () => mockFunctions);
      jest.mock('cors', () => () => mockCors);
      jest.mock('nodemailer', () => mockNodemailer);
      jest.mock('./emailTemplates', () => mockEmailTemplates);

      require('./sendSignInEmail');
    });

    const makeReq = (method, body) => ({ method, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    });

    it('returns 405 for GET request', async () => {
      const req = makeReq('GET', {});
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 when email is missing', async () => {
      const req = makeReq('POST', { signInLink: 'https://link' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and signInLink are required' });
    });

    it('returns 400 when signInLink is missing', async () => {
      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('sends email and returns 200 on success', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        signInLink: 'https://sign-in.example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        messageId: 'msg123'
      }));
    });

    it('calls getSignInEmailContent with correct params', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        signInLink: 'https://link',
        airportName: 'Thun',
        themeColor: '#003'
      });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(mockEmailTemplates.getSignInEmailContent).toHaveBeenCalledWith({
        signInLink: 'https://link',
        airportName: 'Thun',
        themeColor: '#003'
      });
    });

    it('returns 500 when SMTP settings are missing', async () => {
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => null });
      const req = makeReq('POST', {
        email: 'user@example.com',
        signInLink: 'https://link'
      });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 when required SMTP settings are incomplete', async () => {
      mockAdmin.database().ref().once.mockResolvedValue({
        val: () => ({ host: 'smtp.example.com' }) // missing port, user, etc.
      });
      const req = makeReq('POST', {
        email: 'user@example.com',
        signInLink: 'https://link'
      });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('creates transporter with correct SMTP settings', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        signInLink: 'https://link'
      });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          secure: true
        })
      );
    });
  });
});
