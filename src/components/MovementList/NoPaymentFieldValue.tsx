import React from 'react';
import {Link} from 'react-router-dom'
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const StyledLink = styled(Link)`
  text-decoration: underline;
  font-size: 0.95em;
`

const FieldValue = styled.div`
  color: ${props => props.theme.colors.danger};
`

const NoPaymentFieldValue = ({arrivalId}) => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <FieldValue>{t('movement.paymentPending')}</FieldValue>
      <div><StyledLink to={`/arrival/${arrivalId}/payment`}>{t('movement.payNow')}</StyledLink></div>
    </Wrapper>
  );
};

NoPaymentFieldValue.propTypes = {
  arrivalId: PropTypes.string.isRequired,
}

export default NoPaymentFieldValue;
