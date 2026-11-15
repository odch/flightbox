import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import EntranceLayout from '../EntranceLayout';
import H1 from '../H1';
import MaterialIcon from '../MaterialIcon';
import AerodromeStatusBanner from '../AerodromeStatusBanner';
import { pprGuestRequestsEnabled } from '../../modules/ppr/access';

const Text = styled.p`
  line-height: 1.4;
`;

// Across the column, like the text above it
const StatusBanner = styled(AerodromeStatusBanner)`
  && {
    width: auto;
    margin: 1.5em 0 0;
  }
`;

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
  margin-top: 2em;
`;

// Like the entries of the start page
const Choice = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 1em 1.25em;
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

const ChoiceText = styled.span`
  flex: 1;
`;

const ChoiceTitle = styled.span`
  display: block;
  margin-bottom: 0.25em;
  font-size: 1.2em;
  font-weight: 600;
`;

const ChoiceHelp = styled.span`
  display: block;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
`;

// The icon font's ligature is a word: not for screen readers
const ChoiceIcon = styled.span`
  display: flex;
  color: #666;
`;

const Privacy = styled.p`
  margin-top: 2em;
  font-size: 0.85em;

  a {
    color: #666;
    text-decoration: underline;
  }
`;

const ChoiceLink = ({ to, title, help, dataCy }: { to: string; title: string; help: string; dataCy: string }) => (
  <Choice to={to} data-cy={dataCy}>
    <ChoiceText>
      <ChoiceTitle>{title}</ChoiceTitle>
      <ChoiceHelp>{help}</ChoiceHelp>
    </ChoiceText>
    <ChoiceIcon aria-hidden="true"><MaterialIcon icon="chevron_right"/></ChoiceIcon>
  </Choice>
);

// Where visitors without a login choose how to request PPR, e.g. coming from
// the link on the aerodrome's website
const PprIntroPage = ({ privacyPolicyUrl }: { privacyPolicyUrl: string | null }) => {
  const { t } = useTranslation();
  const aerodrome = __CONF__.aerodrome.name;
  return (
    <EntranceLayout>
      <H1>{t('ppr.requestFor', { aerodrome })}</H1>
      <Text>{t('ppr.intro.text', { aerodrome })}</Text>
      <StatusBanner/>
      <Choices>
        {/* Requests with login need the login's email address */}
        {__CONF__.loginForm === 'email' && (
          <ChoiceLink
            to="/ppr/login"
            title={t('ppr.intro.withLogin')}
            help={t('ppr.intro.withLoginHelp')}
            dataCy="ppr-with-login"
          />
        )}
        {pprGuestRequestsEnabled() && (
          <ChoiceLink
            to="/ppr/guest"
            title={t('ppr.intro.withoutLogin')}
            help={t('ppr.intro.withoutLoginHelp')}
            dataCy="ppr-without-login"
          />
        )}
      </Choices>
      {privacyPolicyUrl && (
        <Privacy>
          <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">{t('legal.privacyPolicy')}</a>
        </Privacy>
      )}
    </EntranceLayout>
  );
};

export default PprIntroPage;
