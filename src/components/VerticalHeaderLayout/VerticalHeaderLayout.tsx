import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Header from './Header';
import Content from './Content';
import { RootState } from '../../modules';

const Footer = styled.footer`
  padding: 1em;
  text-align: center;
`

const FooterLink = styled.a`
  font-size: 0.85em;
  color: #666;
  text-decoration: underline;
`

function VerticalHeaderLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const privacyPolicyUrl = useSelector((state: RootState) => state.settings.privacyPolicyUrl.url);

  return (
    <div>
      <Header/>
      <Content>{children}</Content>
      {privacyPolicyUrl && /^https?:\/\//.test(privacyPolicyUrl) && (
        <Footer>
          <FooterLink href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
            {t('legal.privacyPolicy')}
          </FooterLink>
        </Footer>
      )}
    </div>
  );
}

export default VerticalHeaderLayout;
