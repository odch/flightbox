import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../LabeledComponent';
import Centered from '../Centered';
import Failure from './Failure';
import Button from '../Button';

const handleSubmit = (authenticate, username, password, e) => {
  e.preventDefault();
  authenticate(username, password);
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
  @media(max-width: 600px) {
    width: 100%;
  }
`;

const SubmitButton = styled(LoginDialogButton)`
  float: right;
  margin-bottom: 1em;
`;

const UsernamePasswordLoginForm = props => {
  const { authenticate, username, password, submitting, failure, updateUsername, updatePassword } = props;

  const usernameInput = (
    <StyledInput
      type="text"
      value={username}
      autoFocus={true}
      readOnly={submitting}
      onChange={e => { updateUsername(e.target.value); }}
      data-cy="username"
    />
  );
  const passwordInput = (
    <StyledInput
      type="password"
      value={password}
      readOnly={submitting}
      onChange={e => { updatePassword(e.target.value); }}
      data-cy="password"
    />
  );

  return (
    <Wrapper>
      <form
        onSubmit={handleSubmit.bind(null, authenticate, username, password)}
        disabled={props.submitting}
        data-cy="login-form"
      >
        <StyledLabeledComponent label="Benutzername" component={usernameInput}/>
        <StyledLabeledComponent label="Passwort" component={passwordInput}/>
        <Failure failure={failure}/>
        <SubmitButton
          type="submit"
          label="Anmelden"
          icon="send"
          disabled={submitting || username.length === 0 || password.length === 0}
          primary
          dataCy="submit"
          loading={props.submitting}
        />
        {props.showCancel === true && (
          <LoginDialogButton type="button" label="Abbrechen" onClick={props.onCancel} dataCy="cancel"/>
        )}
      </form>
    </Wrapper>
  );
};

UsernamePasswordLoginForm.propTypes = {
  authenticate: PropTypes.func.isRequired,
  updateUsername: PropTypes.func.isRequired,
  updatePassword: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showCancel: PropTypes.bool.isRequired,
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  failure: PropTypes.bool.isRequired,
};

export default UsernamePasswordLoginForm;
