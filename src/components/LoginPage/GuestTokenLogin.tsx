import React from 'react';
import Button from '../Button'
import styled from 'styled-components'
import Failure from './Failure'
import { useTranslation } from 'react-i18next';

const StyledButton = styled(Button)`
  margin-top: 2em;
  margin-bottom: 1em;
  width: 100%;
`

// `label`: e.g. «Als Gast fortfahren» on the login of a PPR request
const GuestTokenLogin = ({submitting, failure, queryToken, authenticate, label}) => {
  const { t } = useTranslation();
  const handleClick = () => {
    authenticate(queryToken)
  }

  return (
    <>
      <StyledButton
        type="button"
        label={label || t('login.loginAsGuest')}
        icon="send"
        disabled={submitting}
        primary
        loading={submitting}
        onClick={handleClick}
      />
      {failure && <Failure failure={failure}/>}
    </>
  )
}

export default GuestTokenLogin
