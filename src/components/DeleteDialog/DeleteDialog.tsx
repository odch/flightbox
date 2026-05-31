import ModalDialog from '../ModalDialog'
import React from 'react'
import styled from 'styled-components'
import Button from '../Button'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

const Question = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const DeleteDialog = ({question, onConfirm, onCancel}) => {
  const { t } = useTranslation();
  const content = (
    <div>
      <Question>{question}</Question>
      <ButtonContainer>
        <Button label={t('common.cancel')} onClick={onCancel} neutral/>
        <Button label={t('common.delete')} icon="delete" danger onClick={onConfirm}/>
      </ButtonContainer>
    </div>
  )

  return <ModalDialog content={content} onBlur={onCancel}/>
}

DeleteDialog.propTypes = {
  question: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}

export default DeleteDialog
