import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../LabeledComponent';
import Centered from '../Centered';
import Failure from './Failure';
import Button from '../Button';

const handleSubmit = (authenticate, email, e) => {
  e.preventDefault();
  authenticate(email);
};

const Wrapper = styled(Centered)`
  width: 500px;
  box-sizing: border-box;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
      padding: 1em;
      top: 25%;
      left: 0;
      margin-right: 0;
      transform: none;
    }
  }
`;

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

const EmailLoginForm = props => {
  const {
    authenticate,
    email,
    submitting,
    failure,
    emailSent,
    updateEmail
  } = props;

  if (emailSent) {
    return <Wrapper>
      <div style={{textAlign: 'center'}}>Es wurde eine E-Mail an <span
        style={{fontWeight: 'bold'}}>{email}</span> gesendet. Folgen Sie bitte den Anweisungen in der E-Mail, um die
        Anmeldung abzuschliessen.
      </div>
    </Wrapper>
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
    <Wrapper>
      <form
        onSubmit={handleSubmit.bind(null, authenticate, email)}
        disabled={props.submitting}
        data-cy="login-form"
      >
        <StyledLabeledComponent label="E-Mail" component={emailInput}/>
        <Failure failure={failure}/>
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
      </form>
    </Wrapper>
  )
};

EmailLoginForm.propTypes = {
  authenticate: PropTypes.func.isRequired,
  updateEmail: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showCancel: PropTypes.bool.isRequired,
  email: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  failure: PropTypes.bool.isRequired,
  emailSent: PropTypes.bool.isRequired,
};

export default EmailLoginForm;
