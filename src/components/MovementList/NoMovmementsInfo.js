import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.danger}
`;

const NoMovementsInfo = () => {
  const { t } = useTranslation();
  return <Wrapper>{t('movement.noMovements')}</Wrapper>;
};

export default NoMovementsInfo;
