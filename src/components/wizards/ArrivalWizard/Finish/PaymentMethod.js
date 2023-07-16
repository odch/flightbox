import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {Step} from '../../../../modules/ui/arrivalPayment'
import SingleSelect from '../../../SingleSelect'
import {NextButton, CancelButton} from '../../../WizardNavigation'
import CashPaymentMessage from './CashPaymentMessage'
import FinishActions from './FinishActions'

const Container = styled.div`
  padding: 2em;
`

const SelectContainer = styled.div`
  width: 400px;
  max-width: 100%;
  margin: auto;
  font-size: 1.5em;
`

const InstructionMessage = styled.div`
  font-size: 1.2em;
  margin: 1em;
`

const FailureMessage = styled(InstructionMessage)`
  color: ${props => props.theme.colors.danger};
`

const StyledNextButton = styled(NextButton)`
  margin-top: 1em;
  margin-bottom: 1em;
`

const StyledCancelButton = styled(CancelButton)`
  margin-top: 1em;
  margin-bottom: 1em;
`

const PaymentMethod = ({
                         itemKey,
                         method,
                         step,
                         amount,
                         failure,
                         createCardPayment,
                         createMovementFromMovement,
                         finish,
                         setMethod,
                         setStep,
                         cancelCardPayment
                       }) => (
  <Container>
    {failure && (
      <FailureMessage>Die Zahlung ist fehlgeschlagen. Bitte versuchen Sie es erneut.</FailureMessage>
    )}
    {step === Step.COMPLETED ? (
      <>
        {method === 'cash' ? (
          <CashPaymentMessage itemKey={itemKey}/>
        ) : (
          <InstructionMessage>Die Zahlung war erfolgreich</InstructionMessage>
        )}
        <FinishActions itemKey={itemKey}
                       createMovementFromMovement={createMovementFromMovement}
                       finish={finish}/>
      </>
    ) : step === Step.CONFIRMED ? (
      method === 'card' ? (
        <>
          <InstructionMessage>Bitte folgen Sie den Anweisungen auf dem Kartenlesegerät</InstructionMessage>
          <StyledCancelButton
            type="button"
            label="Abbrechen"
            onClick={() => {
              cancelCardPayment()
            }}
          />
        </>
      ) : null
    ) : (<>
        <InstructionMessage>Bitte wählen Sie eine Zahlungsart:</InstructionMessage>
        <SelectContainer>
          <SingleSelect
            items={[{
              label: 'Bar',
              value: 'cash'
            }, {
              label: 'Karte',
              value: 'card'
            }]}
            orientation="vertical"
            onChange={e => setMethod(e.target.value)}
            value={method}
          />
        </SelectContainer>
        <StyledNextButton
          type="submit"
          label="Weiter"
          icon="navigate_next"
          onClick={() => {
            if (!method) {
              return
            }

            if (method === 'cash') {
              setStep(Step.COMPLETED)
            } else if (method === 'card') {
              setStep(Step.CONFIRMED)
              createCardPayment(itemKey, amount, 'CHF',)
            }
          }}
          dataCy="next-button"
          primary
          disabled={!method}
        />
      </>
    )}
  </Container>
)

PaymentMethod.propTypes = {
  itemKey: PropTypes.string.isRequired,
  step: PropTypes.string.isRequired,
  method: PropTypes.string,
  amount: PropTypes.number.isRequired,
  failure: PropTypes.bool.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  setMethod: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  cancelCardPayment: PropTypes.func.isRequired,
}

export default PaymentMethod
