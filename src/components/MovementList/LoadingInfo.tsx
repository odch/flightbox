import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  text-align: center;
`;

const LoadingInfo = () => {
  const { t } = useTranslation();
  return (
    <Wrapper><MaterialIcon icon="sync" rotate="left"/> {t('movement.loading')}</Wrapper>
  );
};

export default LoadingInfo;
