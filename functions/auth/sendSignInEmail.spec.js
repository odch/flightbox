describe('functions', () => {
  describe('auth/sendSignInEmail', () => {
    let mockAdmin;
    let mockNodemailer;
    let mockEmailTemplates;
    let mockSendMail;
    let mockTransporter;
    let sendSignInEmail;
    let loadSmtpSettings;
    let createTransporter;

    const smtpSettings = {
      host: 'smtp.example.com',
      port: '587',
      user: 'user@example.com',
      password: 'secret',
      fromEmail: 'noreply@example.com',
      fromName: 'Flightbox'
    };

    beforeEach(() => {
      jest.resetModules();

      const mockOnce = jest.fn().mockResolvedValue({
        val: () => smtpSettings
      });

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue({ once: mockOnce })
        })
      };

      mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg123' });
      mockTransporter = { sendMail: mockSendMail };

      mockNodemailer = {
        createTransport: jest.fn().mockReturnValue(mockTransporter)
      };

      mockEmailTemplates = {
        getSignInEmailContent: jest.fn().mockReturnValue({
          subject: 'Sign in',
          html: '<p>Your code: 123456</p>',
          text: 'Your code: 123456'
        })
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('nodemailer', () => mockNodemailer);
      jest.mock('./emailTemplates', () => mockEmailTemplates);

      const module = require('./sendSignInEmail');
      sendSignInEmail = module.sendSignInEmail;
      loadSmtpSettings = module.loadSmtpSettings;
      createTransporter = module.createTransporter;
    });

    describe('sendSignInEmail', () => {
      it('sends email with correct parameters', async () => {
        const messageId = await sendSignInEmail({
          email: 'user@example.com',
          signInCode: '123456',
          airportName: 'Thun',
          themeColor: '#003863'
        });

        expect(mockSendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'user@example.com',
            subject: 'Sign in',
          })
        );
        expect(messageId).toBe('msg123');
      });

      it('calls getSignInEmailContent with correct params', async () => {
        await sendSignInEmail({
          email: 'user@example.com',
          signInCode: '123456',
          airportName: 'Thun',
          themeColor: '#003'
        });

        expect(mockEmailTemplates.getSignInEmailContent).toHaveBeenCalledWith({
          signInCode: '123456',
          airportName: 'Thun',
          themeColor: '#003'
        });
      });

      it('throws when SMTP settings are missing', async () => {
        mockAdmin.database().ref().once.mockResolvedValue({ val: () => null });

        await expect(sendSignInEmail({
          email: 'user@example.com',
          signInCode: '123456'
        })).rejects.toThrow('SMTP settings not found');
      });

      it('throws when required SMTP settings are incomplete', async () => {
        mockAdmin.database().ref().once.mockResolvedValue({
          val: () => ({ host: 'smtp.example.com' })
        });

        await expect(sendSignInEmail({
          email: 'user@example.com',
          signInCode: '123456'
        })).rejects.toThrow('Missing SMTP settings');
      });

      it('uses correct from address', async () => {
        await sendSignInEmail({
          email: 'user@example.com',
          signInCode: '123456'
        });

        const mailArgs = mockSendMail.mock.calls[0][0];
        expect(mailArgs.from).toBe('"Flightbox" <noreply@example.com>');
      });
    });

    describe('loadSmtpSettings', () => {
      it('resolves with settings when all fields present', async () => {
        const settings = await loadSmtpSettings();
        expect(settings).toEqual(smtpSettings);
      });

      it('throws when settings are null', async () => {
        mockAdmin.database().ref().once.mockResolvedValue({ val: () => null });
        await expect(loadSmtpSettings()).rejects.toThrow('SMTP settings not found');
      });

      it('throws when settings are incomplete', async () => {
        mockAdmin.database().ref().once.mockResolvedValue({
          val: () => ({ host: 'smtp.example.com' })
        });
        await expect(loadSmtpSettings()).rejects.toThrow('Missing SMTP settings');
      });
    });

    describe('createTransporter', () => {
      it('creates transporter with correct settings', () => {
        createTransporter(smtpSettings);
        expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.example.com',
            port: 587,
            secure: true,
            auth: {
              user: 'user@example.com',
              pass: 'secret'
            }
          })
        );
      });

      it('parses port as integer', () => {
        createTransporter({ ...smtpSettings, port: '465' });
        const callArgs = mockNodemailer.createTransport.mock.calls[0][0];
        expect(callArgs.port).toBe(465);
        expect(typeof callArgs.port).toBe('number');
      });
    });
  });
});
