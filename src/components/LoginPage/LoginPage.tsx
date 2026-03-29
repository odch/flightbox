import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Header from './Header';
import EmailLoginForm from '../../containers/EmailLoginFormContainer'
import UsernamePasswordLoginForm from '../../containers/UsernamePasswordLoginFormContainer'
import styled from 'styled-components'
import {withRouter} from 'react-router-dom'
import getAuthQueryToken, {getGuestOnly} from '../../util/getAuthQueryToken'

const StyledWrapper = styled.div`
  display: flex;
  min-height: 100vh;

  @media screen and (max-width: 520px) {
    & {
      flex-direction: column;
    }
  }
`

const LoginWrapper = styled.div`
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
      flex: 1;
    }
  }
`;

const LoginInnerWrapper = styled.div`
  width: 60%;
  max-width: 800px;
  padding: 1em;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
    }
  }
`

const PrivacyText = styled.p`
  margin-top: 2em;
  font-size: 0.85em;
  color: #666;

  a {
    color: #666;
    text-decoration: underline;
  }
`

const LoginPage = ({location, privacyPolicyUrl, emailSent}: {location: any, privacyPolicyUrl?: string | null, emailSent?: boolean}) => {
  const { t } = useTranslation();
  const queryToken = getAuthQueryToken(location)
  const guestOnly = getGuestOnly(location)
  return (
    <StyledWrapper>
      <Header/>
      <LoginWrapper>
        <LoginInnerWrapper>
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
        </LoginInnerWrapper>
      </LoginWrapper>
    </StyledWrapper>
  );
}

export default withRouter(LoginPage);
