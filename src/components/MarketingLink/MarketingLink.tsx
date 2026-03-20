import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { RootState } from '../../modules';

import logo from './odch_logo.png';

const Wrapper = styled.div`
  padding: 1em;
  text-align: center;
`;

const A = styled.a`
  color: #666;
  text-decoration: none;
`;

const PrivacyLink = styled.a`
  display: inline-block;
  margin-top: 0.5em;
  font-size: 0.85em;
  color: #666;
  text-decoration: none;
`

const Logo = styled.img`
  margin-right: 5px;
  vertical-align: middle;
  height: 25px;
`

const MarketingLink = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const privacyPolicyUrl = useSelector((state: RootState) => state.settings.privacyPolicyUrl.url);
  const linked = useSelector((state: RootState) => (state.auth?.data as any)?.links);

  const text = <>
    <Logo src={logo}/>
    <span>Flightbox</span>
  </>
  const content = linked
    ? <A href="https://opendigital.ch/flightbox/" target="_blank">{text}</A>
    : text
  return (
    <Wrapper className={className}>
      <div>{content}</div>
      {privacyPolicyUrl && /^https?:\/\//.test(privacyPolicyUrl) && (
        <PrivacyLink href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
          {t('legal.privacyPolicy')}
        </PrivacyLink>
      )}
    </Wrapper>
  );
};

export default MarketingLink;
