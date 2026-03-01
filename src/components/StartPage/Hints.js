import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types'
import { withTranslation } from 'react-i18next';

const Wrapper = styled.div`
  border-radius: 10px;
  background-color: ${props => props.theme.colors.background};
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
    const { t } = this.props;
    return (
      <Wrapper>
        <ul>
          <Hint>{t('hints.departureBeforeStart_pre')} <Strong>{t('hints.departureBeforeStart_text')}</Strong>.</Hint>
          <Hint>{t('hints.arrivalAfterLanding_pre')} <Strong>{t('hints.arrivalAfterLanding_text')}</Strong>.</Hint>
          {this.props.guest !== true && this.props.kiosk !== true && (<Hint>{t('hints.associatedMovement_pre')} <I>{t('hints.recordArrival')}</I> {t('hints.associatedMovement_mid')} <I>{t('hints.recordDeparture')}</I>{t('hints.associatedMovement_post')} <StyledLink to="/movements">{t('hints.recordedMovement')}</StyledLink>.
          </Hint>)}
        </ul>
      </Wrapper>
    );
  }
}

Hints.propTypes = {
  guest: PropTypes.bool,
  kiosk: PropTypes.bool
}

export default withTranslation()(Hints);
