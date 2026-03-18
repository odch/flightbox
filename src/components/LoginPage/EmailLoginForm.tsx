import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import LabeledComponent from '../LabeledComponent';
import Failure from './Failure';
import Button from '../Button';
import GuestTokenLogin from '../../containers/GuestTokenLoginContainer'
import OtpCodeForm from './OtpCodeForm';

const handleSubmit = (authenticate, email, local, e) => {
  e.preventDefault();
  authenticate(email, local);
};

const StyledLabeledComponent = styled(LabeledComponent)`
  margin-bottom: 2em;
`;

const StyledInput = styled.input`
  border: 0;
  border-bottom: 1px solid #000;
  padding: 1px;
`;

const LoginDialogButton = styled(Button)`
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SubmitButton = styled(LoginDialogButton)`
  float: right;
  margin-bottom: 1em;
`;

const StyledForm = styled.form<{ disabled?: boolean }>`
  overflow: hidden;
`

const StyledHint = styled.div`
  font-size: 0.8em;
  color: #aaa;
`

const StyledOrContainer = styled.div`
  text-align: center;
  border-top: 1px solid #ddd;
  margin-top: 3em;
`

const StyledOrText = styled.span`
  position: relative;
  top: -8px;
  background-color: white;
  padding: 20px;
`

const EmailLoginForm = props => {
  const { t } = useTranslation();
  const {
    queryToken,
    guestOnly,
    sendAuthenticationEmail,
    verifyOtpCode,
    email,
    submitting,
    failure,
    emailSent,
    otpVerificationFailure,
    updateEmail,
    resetOtp
  } = props;

  if (emailSent) {
    return (
      <OtpCodeForm
        email={email}
        submitting={submitting}
        failure={otpVerificationFailure}
        onSubmit={(code) => verifyOtpCode(email, code)}
        onResend={() => sendAuthenticationEmail(email, !!queryToken)}
        onChangeEmail={resetOtp}
      />
    );
  }

  const emailInput = (
    <StyledInput
      type="email"
      value={email}
      autoFocus={true}
      readOnly={submitting}
      onChange={e => {
        updateEmail(e.target.value);
      }}
      data-cy="email"
    />
  );

  return (
    <div>
      {!guestOnly && (
        <StyledForm
          onSubmit={handleSubmit.bind(null, sendAuthenticationEmail, email, !!queryToken)}
          disabled={props.submitting}
          data-cy="login-form"
        >
          <StyledLabeledComponent label={t('login.emailLabel')} component={emailInput}/>
          {failure && <Failure failure={failure}/>}
          <SubmitButton
            type="submit"
            label={t('login.loginButton')}
            icon="send"
            disabled={submitting || email.length === 0}
            primary
            dataCy="submit"
            loading={props.submitting}
          />
          {props.showCancel === true && (
            <LoginDialogButton type="button" label={t('login.cancelButton')} onClick={props.onCancel} dataCy="cancel"/>
          )}
        </StyledForm>
      )}
      {queryToken && (
        guestOnly
          ? <GuestTokenLogin queryToken={queryToken}/>
          : (
            <>
              <StyledHint>{t('login.hintEmailLogin')}</StyledHint>
              <StyledOrContainer><StyledOrText>{t('login.or')}</StyledOrText></StyledOrContainer>
              <GuestTokenLogin queryToken={queryToken}/>
              <StyledHint>{t('login.hintGuestLogin')}</StyledHint>
            </>
          )
      )}
    </div>
  )
};

(EmailLoginForm as any).propTypes = {
  queryToken: PropTypes.string,
  guestOnly: PropTypes.bool,
  sendAuthenticationEmail: PropTypes.func.isRequired,
  verifyOtpCode: PropTypes.func.isRequired,
  updateEmail: PropTypes.func.isRequired,
  resetOtp: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showCancel: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  failure: PropTypes.bool.isRequired,
  emailSent: PropTypes.bool.isRequired,
  otpVerificationFailure: PropTypes.bool.isRequired,
};

export default EmailLoginForm;
