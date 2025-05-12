import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../LabeledComponent';
import Failure from './Failure';
import Button from '../Button';
import GuestTokenLogin from '../../containers/GuestTokenLoginContainer'

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

const StyledForm = styled.form`
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
  const {
    queryToken,
    guestOnly,
    sendAuthenticationEmail,
    completeEmailAuthentication,
    email,
    submitting,
    failure,
    emailSent,
    emailLoginParamsPresent,
    emailLoginCompletionFailure,
    updateEmail
  } = props;

  if (emailSent) {
    return <div style={{textAlign: 'center'}}>Es wurde eine E-Mail an <span
      style={{fontWeight: 'bold'}}>{email}</span> gesendet. Folgen Sie bitte den Anweisungen in der E-Mail, um die
      Anmeldung abzuschliessen.
    </div>
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

  if (emailLoginParamsPresent) {
    return (
      <div>
        <div style={{marginBottom: '2rem'}}>Sie wollen sich über einen Login-Link anmelden. Geben Sie Ihre E-Mail-Adresse noch einmal ein, um die
          Anmeldung abzuschliessen.
        </div>
        <StyledForm
          onSubmit={handleSubmit.bind(null, completeEmailAuthentication, email, !!queryToken)}
          disabled={props.submitting}
          data-cy="login-form"
        >
          <StyledLabeledComponent label="E-Mail" component={emailInput}/>
          {emailLoginCompletionFailure && <Failure failure/>}
          <SubmitButton
            type="submit"
            label="Anmelden"
            icon="send"
            disabled={submitting || email.length === 0}
            primary
            dataCy="submit"
            loading={props.submitting}
          />
        </StyledForm>
      </div>
    )
  }

  return (
    <div>
      {!guestOnly && (
        <StyledForm
          onSubmit={handleSubmit.bind(null, sendAuthenticationEmail, email, !!queryToken)}
          disabled={props.submitting}
          data-cy="login-form"
        >
          <StyledLabeledComponent label="E-Mail" component={emailInput}/>
          {failure && <Failure failure={failure}/>}
          <SubmitButton
            type="submit"
            label="Anmelden"
            icon="send"
            disabled={submitting || email.length === 0}
            primary
            dataCy="submit"
            loading={props.submitting}
          />
          {props.showCancel === true && (
            <LoginDialogButton type="button" label="Abbrechen" onClick={props.onCancel} dataCy="cancel"/>
          )}
        </StyledForm>
      )}
      {queryToken && (
        guestOnly
          ? <GuestTokenLogin queryToken={queryToken}/>
          : (
            <>
              <StyledHint>Wenn Sie sich mit Ihrer E-Mail-Adresse anmelden, können Sie Ihre eigenen erfassten
                Bewegungen
                anschliessend noch einsehen und
                ggf. korrigieren.
              </StyledHint>
              <StyledOrContainer><StyledOrText>oder</StyledOrText></StyledOrContainer>
              <GuestTokenLogin queryToken={queryToken}/>
              <StyledHint>Wenn Sie sich als Gast anmelden, können Sie nur Ihre Ankunft und Ihren Abflug erfassen. Die
                erfassten Bewegungen können Sie anschliessend nicht mehr einsehen.
              </StyledHint>
            </>
          )
      )}
    </div>
  )
};

EmailLoginForm.propTypes = {
  queryToken: PropTypes.string,
  guestOnly: PropTypes.bool,
  sendAuthenticationEmail: PropTypes.func.isRequired,
  completeEmailAuthentication: PropTypes.func.isRequired,
  updateEmail: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showCancel: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  failure: PropTypes.bool.isRequired,
  emailSent: PropTypes.bool.isRequired,
  emailLoginParamsPresent: PropTypes.bool.isRequired,
  emailLoginCompletionFailure: PropTypes.bool.isRequired,
};

export default EmailLoginForm;
