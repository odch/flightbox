import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MaterialIcon from '../MaterialIcon';

const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
const movementsImagePath = require('./ic_list_black_48dp_2x.png');

const PHONE = '@media screen and (max-width: 768px)';

// The entries in three tiers, by importance: recording movements, what
// pilots come for; then the PPR requests and the administration; then
// feedback and help
const Wrapper = styled.div`
  width: 80%;
  max-width: 1100px;
  margin: 2em auto 1em;

  ${PHONE} {
    width: auto;
    margin: 1.5em 1em 1em;
  }
`;

const Primary = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5em;

  ${PHONE} {
    gap: 0.5em;
  }
`;

const Card = styled(Link)`
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: white;
  color: inherit;
  text-decoration: none;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const PrimaryEntry = styled(Card)`
  flex: 1 1 0;
  min-width: 0;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  padding: 1.25em 0.5em;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 2em;
  line-height: 1.15;
  text-align: center;
  hyphens: auto;
  overflow-wrap: break-word;

  img {
    width: 96px;
    height: 96px;
  }

  /* Three side by side in less space: "Bewegungen" still fits */
  @media screen and (min-width: 769px) and (max-width: 1000px) {
    font-size: 1.6em;
  }

  ${PHONE} {
    padding: 0.75em 0.25em;
    font-size: 1em;

    img {
      width: 48px;
      height: 48px;
    }
  }

  /* The same on the narrowest phones */
  @media screen and (max-width: 360px) {
    font-size: 0.9em;
  }
`;

const Secondary = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1em;
  margin-top: 1.5em;

  ${PHONE} {
    flex-direction: column;
    gap: 0.5em;
    margin-top: 0.75em;
  }
`;

const SecondaryEntry = styled(Card)`
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.75em 1.25em;
  font-size: 1.3em;

  ${PHONE} {
    padding: 0.75em 1em;
    font-size: 1.1em;
  }
`;

const Tertiary = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5em 2em;
  margin-top: 2em;

  ${PHONE} {
    margin-top: 1.5em;
  }
`;

const TertiaryEntry = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.25em 0;
  color: #666;
  font-size: 1.1em;
  text-decoration: none;

  &:hover {
    color: #333;
    text-decoration: underline;
  }
`;

// In the colour of the text. The icon font's ligature is a word: not for
// screen readers.
const Icon = styled.span`
  display: flex;
`;

const EntryIcon = ({ icon, size }: { icon: string; size: number }) => (
  <Icon aria-hidden="true"><MaterialIcon icon={icon} size={size}/></Icon>
);

const EntryPoints = ({ admin, guest, kiosk, email }: any) => {
  const { t } = useTranslation();
  // Guests and the kiosk only record their movements
  const limited = guest === true || kiosk === true;
  // PPR requests belong to the pilot's email address, so logins without
  // one (username/password) cannot use them.
  const pprAvailable = !limited && typeof __CONF__ !== 'undefined' && __CONF__.ppr === true && !!email;
  const adminAvailable = !limited && admin === true;

  return (
    <Wrapper>
      <Primary data-cy="entry-points-primary">
        <PrimaryEntry to="/departure/new" data-cy="new-departure">
          <img src={departureImagePath} alt=""/>{t('nav.departure')}
        </PrimaryEntry>
        <PrimaryEntry to="/arrival/new" data-cy="new-arrival">
          <img src={arrivalImagePath} alt=""/>{t('nav.arrival')}
        </PrimaryEntry>
        {!limited && (
          <PrimaryEntry to="/movements" data-cy="movements">
            <img src={movementsImagePath} alt=""/>{t('nav.movements')}
          </PrimaryEntry>
        )}
      </Primary>

      {(pprAvailable || adminAvailable) && (
        <Secondary data-cy="entry-points-secondary">
          {pprAvailable && (
            <SecondaryEntry to="/ppr/new" data-cy="new-ppr">
              <EntryIcon icon="assignment" size={28}/>{t('nav.ppr')}
            </SecondaryEntry>
          )}
          {pprAvailable && (
            <SecondaryEntry to="/ppr" data-cy="ppr-list">
              <EntryIcon icon="assignment_ind" size={28}/>{t('nav.pprList')}
            </SecondaryEntry>
          )}
          {adminAvailable && (
            <SecondaryEntry to="/admin" data-cy="admin">
              <EntryIcon icon="settings" size={28}/>{t('nav.admin')}
            </SecondaryEntry>
          )}
        </Secondary>
      )}

      <Tertiary data-cy="entry-points-tertiary">
        {!limited && (
          <TertiaryEntry to="/message" data-cy="message">
            <EntryIcon icon="chat_bubble_outline" size={20}/>{t('nav.message')}
          </TertiaryEntry>
        )}
        <TertiaryEntry to="/help" data-cy="help">
          <EntryIcon icon="help_outline" size={20}/>{t('nav.help')}
        </TertiaryEntry>
      </Tertiary>
    </Wrapper>
  );
};

EntryPoints.propTypes = {
  admin: PropTypes.bool,
  guest: PropTypes.bool,
  kiosk: PropTypes.bool,
  email: PropTypes.string,
};

export default EntryPoints;
