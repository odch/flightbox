import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import EmailLoginForm from '../../containers/EmailLoginFormContainer'
import UsernamePasswordLoginForm from '../../containers/UsernamePasswordLoginFormContainer'
import styled from 'styled-components'
import {Link, matchPath, useLocation} from 'react-router-dom'
import getAuthQueryToken, {getGuestOnly} from '../../util/getAuthQueryToken'
import EntranceLayout from '../EntranceLayout';
import MaterialIcon from '../MaterialIcon';
import { pprEnabled } from '../../modules/ppr/access';

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

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-bottom: 1em;
  color: #666;
`

// The icon font's ligature is a word: not for screen readers
const BackIcon = styled.span`
  display: flex;
`

const LoginPage = ({privacyPolicyUrl, emailSent}: {privacyPolicyUrl?: string | null, emailSent?: boolean}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const queryToken = getAuthQueryToken(location)
  const guestOnly = getGuestOnly(location)
  // «Mit Anmeldung fortfahren» of the PPR intro: the PPR form follows the
  // login (the route itself leads there)
  const pprLogin = pprEnabled() && matchPath('/ppr/login', location.pathname) !== null;
  return (
    <EntranceLayout>
      {pprLogin && (
        <PprContext data-cy="ppr-login-context">
          <BackLink to="/ppr/new">
            <BackIcon aria-hidden="true"><MaterialIcon icon="arrow_back" size={18}/></BackIcon>
            {t('ppr.login.back')}
          </BackLink>
          <p>{t('ppr.login.context')}</p>
        </PprContext>
      )}
      {__CONF__.loginForm === 'email'
        ? <EmailLoginForm queryToken={queryToken} guestOnly={guestOnly}/>
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
