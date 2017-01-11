import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../LabeledComponent';
import MaterialIcon from '../MaterialIcon';
import Centered from '../Centered';
import Failure from './Failure';
import Button from './Button';

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

const SubmitButton = styled(Button)`
  float: right;
`;

const Main = props => {
  const { authenticate, username, password, submitting, failure, updateUsername, updatePassword } = props;

  const usernameInput = (
    <StyledInput
      type="text"
      value={username}
      autoFocus={true}
      readOnly={submitting}
      onChange={e => { updateUsername(e.target.value); }}
    />
  );
  const passwordInput = (
    <StyledInput
      type="password"
      value={password}
      readOnly={submitting}
      onChange={e => { updatePassword(e.target.value); }}
    />
  );

  return (
    <Wrapper className="main">
      <form onSubmit={handleSubmit.bind(null, authenticate, username, password)} disabled={props.submitting}>
        <StyledLabeledComponent label="Benutzername" component={usernameInput}/>
        <StyledLabeledComponent label="Passwort" component={passwordInput}/>
        <Failure failure={failure}/>
        {props.showCancel === true && <Button type="button" onClick={props.onCancel}>Abbrechen</Button>}
        <SubmitButton type="submit" disabled={submitting || username.length === 0 || password.length === 0}>
          <MaterialIcon icon="send"/>&nbsp;Anmelden
        </SubmitButton>
      </form>
    </Wrapper>
  );
};

Main.propTypes = {
  authenticate: React.PropTypes.func.isRequired,
  updateUsername: React.PropTypes.func.isRequired,
  updatePassword: React.PropTypes.func.isRequired,
  onCancel: React.PropTypes.func.isRequired,
  showCancel: React.PropTypes.bool.isRequired,
  username: React.PropTypes.string.isRequired,
  password: React.PropTypes.string.isRequired,
  submitting: React.PropTypes.bool.isRequired,
  failure: React.PropTypes.bool.isRequired,
};

export default Main;
