import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import EmailLoginForm from '../../containers/EmailLoginFormContainer'
import UsernamePasswordLoginForm from '../../containers/UsernamePasswordLoginFormContainer'
import styled from 'styled-components'
import {matchPath, useLocation} from 'react-router-dom'
import getAuthQueryToken, {getGuestOnly} from '../../util/getAuthQueryToken'
import EntranceLayout from '../EntranceLayout';
import H1 from '../H1';
import AerodromeStatusBanner from '../AerodromeStatusBanner';
import { pprEnabled, pprGuestRequestsEnabled } from '../../modules/ppr/access';

const PrivacyText = styled.p`
  margin-top: 2em;
  font-size: 0.85em;
  color: #666;

  a {
    color: #666;
    text-decoration: underline;
  }
`

const PprContext = styled.div`
  margin-bottom: 2em;
`

const PprText = styled.p`
  line-height: 1.4;
`

// Across the column, like the text above it
const StatusBanner = styled(AerodromeStatusBanner)`
  && {
    width: auto;
    margin: 1.5em 0 0;
  }
`

const LoginPage = ({privacyPolicyUrl, emailSent}: {privacyPolicyUrl?: string | null, emailSent?: boolean}) => {
  const { t } = useTranslation();
  const location = useLocation();
  // The PPR request, e.g. from the link on the aerodrome's website: the form
  // follows the login (the route itself leads there). The link with the
  // guest access token also offers the guest session, where guests may
  // request PPR: elsewhere it would lead them to the start page.
  const pprLogin = pprEnabled() && matchPath('/ppr/new', location.pathname) !== null;
  const queryToken = pprLogin && !pprGuestRequestsEnabled() ? null : getAuthQueryToken(location)
  const guestOnly = getGuestOnly(location)
  const aerodrome = __CONF__.aerodrome.name;
  return (
    <EntranceLayout>
      {pprLogin && (
        <PprContext data-cy="ppr-login-context">
          <H1>{t('ppr.requestFor', { aerodrome })}</H1>
          <PprText>{t('ppr.login.text', { aerodrome })}</PprText>
          <StatusBanner/>
        </PprContext>
      )}
      {__CONF__.loginForm === 'email'
        ? <EmailLoginForm queryToken={queryToken} guestOnly={guestOnly} ppr={pprLogin}/>
        : <UsernamePasswordLoginForm/>
      }
      {privacyPolicyUrl && !emailSent && /^https?:\/\//.test(privacyPolicyUrl) && (
        <PrivacyText>
          <Trans i18nKey="legal.privacyConsent">
            Mit der Anmeldung akzeptieren Sie die <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>.
          </Trans>
        </PrivacyText>
      )}
    </EntranceLayout>
  );
}

export default LoginPage;
