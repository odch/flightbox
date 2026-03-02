import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.danger}
`;

const LoadingInfo = () => {
  const { t } = useTranslation();
  return <Wrapper>{t('movement.loadingFailed')}</Wrapper>;
};

export default LoadingInfo;
