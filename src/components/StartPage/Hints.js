import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types'

const Wrapper = styled.div`
  border-radius: 10px;
  background-color: ${props => props.theme.colors.background}
  margin: 1em auto;
  padding: 1em;
  width: 80%;
  font-size: 1.2em;
  line-height: 1.2em;
`;

const Hint = styled.li`
  padding-left: 1.5em;

  &:before {
    font-family: 'Material Icons';
    content: '\\e5ca';
    margin-left: -1.5em;
    margin-right: 0.5em;
    vertical-align: middle;
  }
`;

const Strong = styled.strong`
  font-weight: bold;
  color: ${props => props.theme.colors.main};
`;

const I = styled.i`
  font-style: italic;
`;

const StyledLink = styled(Link)`
  text-decoration: underline;
`;

class Hints extends React.PureComponent {

  render() {
    return (
      <Wrapper>
        <ul>
          <Hint>Bitte erfassen Sie Ihren <Strong>Abflug immer vor dem Start</Strong>.</Hint>
          <Hint>Bitte erfassen Sie Ihre <Strong>Ankunft immer nach der Landung</Strong>.</Hint>
          {this.props.guest !== true && (<Hint>Möchten Sie eine Ankunft für einen bereits erfassten Abflug erfassen
            (oder umgekehrt), nutzen Sie den Link <I>Ankunft erfassen</I> (bzw. <I>Abflug erfassen</I>)
            bei der bereits <StyledLink to="/movements">erfassten Bewegung</StyledLink>.
          </Hint>)}
        </ul>
      </Wrapper>
    );
  }
}

Hints.propTypes = {
  guest: PropTypes.bool
}

export default Hints;
