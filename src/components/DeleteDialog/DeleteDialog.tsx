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

interface DeleteDialogProps {
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Defaults to "Löschen" with a delete icon; e.g. "Widerrufen" for API keys.
  confirmLabel?: string;
  confirmIcon?: string;
}

const DeleteDialog = ({question, onConfirm, onCancel, confirmLabel, confirmIcon = 'delete'}: DeleteDialogProps) => {
  const { t } = useTranslation();
  const content = (
    <div>
      <Question>{question}</Question>
      <ButtonContainer>
        <Button label={t('common.cancel')} onClick={onCancel} neutral/>
        <Button label={confirmLabel || t('common.delete')} icon={confirmIcon} danger onClick={onConfirm}/>
      </ButtonContainer>
    </div>
  )

  return <ModalDialog content={content} onBlur={onCancel}/>
}

DeleteDialog.propTypes = {
  question: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string,
  confirmIcon: PropTypes.string
}

export default DeleteDialog
