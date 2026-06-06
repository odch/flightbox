import React, {useState} from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next';
import MaterialIcon from '../MaterialIcon';

// The dismiss choice is remembered across visits so the hints do not reappear
// on their own once a pilot who knows the app has hidden them.
const STORAGE_KEY = 'startPageHintsDismissed';

const readStoredDismissed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

const writeStoredDismissed = (value: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch (e) {
    // ignore (e.g. storage disabled in private mode)
  }
};

const Wrapper = styled.div`
  position: relative;
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

const CloseButton = styled.button`
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  display: flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;

  &:hover {
    opacity: 1;
  }
`;

const ShowHintsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4em;
  margin: 1em auto;
  padding: 0;
  border: none;
  background: none;
  /* Muted grey matching the footer font, so restoring the hints stays a quiet,
     unobtrusive affordance rather than a prominent call to action. */
  color: #666;
  font: inherit;
  cursor: pointer;

  &:hover {
    opacity: 0.7;
  }
`;

const Hints = ({ guest, kiosk, hintsDismissable }: any) => {
  const { t } = useTranslation();

  // Guest and kiosk sessions run on shared/public devices where every visitor
  // is effectively a first-time user, so onboarding must always stay visible.
  // A per-login flag (hintsDismissable === false) opts specific accounts (e.g.
  // the lspv terminal user) out of dismissing too.
  const dismissable = guest !== true && kiosk !== true && hintsDismissable !== false;

  const [dismissed, setDismissed] = useState(() => dismissable && readStoredDismissed());

  const dismiss = () => {
    writeStoredDismissed(true);
    setDismissed(true);
  };

  const show = () => {
    writeStoredDismissed(false);
    setDismissed(false);
  };

  if (dismissable && dismissed) {
    return (
      <ShowHintsButton type="button" onClick={show} aria-label={t('hints.show')}>
        <MaterialIcon icon="help_outline" size={20}/>
        {t('hints.show')}
      </ShowHintsButton>
    );
  }

  return (
    <Wrapper>
      {dismissable && (
        <CloseButton type="button" onClick={dismiss} aria-label={t('hints.dismiss')}>
          <MaterialIcon icon="close" size={20}/>
        </CloseButton>
      )}
      <ul>
        <Hint>{t('hints.departureBeforeStart_pre')} <Strong>{t('hints.departureBeforeStart_text')}</Strong>.</Hint>
        <Hint>{t('hints.arrivalAfterLanding_pre')} <Strong>{t('hints.arrivalAfterLanding_text')}</Strong>.</Hint>
        {guest !== true && kiosk !== true && (<Hint>{t('hints.associatedMovement_pre')} <I>{t('hints.recordArrival')}</I> {t('hints.associatedMovement_mid')} <I>{t('hints.recordDeparture')}</I>{t('hints.associatedMovement_post')} <StyledLink to="/movements">{t('hints.recordedMovement')}</StyledLink>.
        </Hint>)}
      </ul>
    </Wrapper>
  );
};

Hints.propTypes = {
  guest: PropTypes.bool,
  kiosk: PropTypes.bool,
  hintsDismissable: PropTypes.bool
}

export default Hints;
