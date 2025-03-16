import ModalDialog from '../ModalDialog'
import React from 'react'
import styled from 'styled-components'
import Button from '../Button'
import PropTypes from 'prop-types'

const Question = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const DeleteDialog = ({question, onConfirm, onCancel}) => {
  const content = (
    <div>
      <Question>{question}</Question>
      <ButtonContainer>
        <Button label="Abbrechen" onClick={onCancel} neutral/>
        <Button label="Löschen" icon="delete" danger onClick={onConfirm}/>
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
