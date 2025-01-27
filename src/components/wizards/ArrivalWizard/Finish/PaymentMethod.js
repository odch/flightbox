import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {Step} from '../../../../modules/ui/arrivalPayment'
import SingleSelect from '../../../SingleSelect'
import {CancelButton, NextButton} from '../../../WizardNavigation'
import CashPaymentMessage from './CashPaymentMessage'
import FinishActions from './FinishActions'
import TwintPaymentMessage from './TwintPaymentMessage'

const PAYMENT_METHODS = [{
    label: 'Karte',
    value: 'card'
  },
  /*
  disabled for now as not fully implemented (payment service connection)
  {
    label: 'Zahlung per Bezahl-Link (E-Mail)',
    value: 'paylink'
  }
  */
  {
    label: 'Bar',
    value: 'cash'
  },
  {
    label: 'Twint',
    value: 'twint_external'
  }]

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
                         email,
                         immatriculation,
                         method,
                         step,
                         amount,
                         landings,
                         landingFeeSingle,
                         landingFeeCode,
                         landingFeeTotal,
                         goArounds,
                         goAroundFeeSingle,
                         goAroundFeeCode,
                         goAroundFeeTotal,
                         failure,
                         createCardPayment,
                         createMovementFromMovement,
                         finish,
                         setMethod,
                         setStep,
                         cancelCardPayment,
                         enabledPaymentMethods
                       }) => (
  <Container>
    {failure && (
      <FailureMessage>Die Zahlung ist fehlgeschlagen. Bitte versuchen Sie es erneut.</FailureMessage>
    )}
    {step === Step.COMPLETED ? (
      <>
        {method === 'cash' ? (
          <CashPaymentMessage itemKey={itemKey}/>
        ) : method === 'twint_external' ? (
          <TwintPaymentMessage itemKey={itemKey}/>
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
      ) : method === 'paylink' ? (
        <>
          <>
            <InstructionMessage>Bitte warten, der Bezahl-Link wird vorbereitet...</InstructionMessage>
            <StyledCancelButton
              type="button"
              label="Abbrechen"
              onClick={() => {
                cancelCardPayment()
              }}
            />
          </>
        </>
      ) : null
    ) : (<>
        <InstructionMessage>Bitte wählen Sie eine Zahlungsart:</InstructionMessage>
        <SelectContainer>
          <SingleSelect
            items={PAYMENT_METHODS.filter(method => enabledPaymentMethods.includes(method.value))}
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

            if (method === 'cash' || method === 'twint_external') {
              setStep(Step.COMPLETED)
            } else if (method === 'card') {
              setStep(Step.CONFIRMED)
              createCardPayment(
                itemKey,
                amount,
                'CHF',
                'card',
                email,
                immatriculation,
                landings,
                landingFeeSingle,
                landingFeeCode,
                landingFeeTotal,
                goArounds,
                goAroundFeeSingle,
                goAroundFeeCode,
                goAroundFeeTotal
              )
            } else if (method === 'paylink') {
              setStep(Step.CONFIRMED)
              createCardPayment(
                itemKey,
                amount,
                'CHF',
                'paylink',
                email,
                immatriculation,
                landings,
                landingFeeSingle,
                landingFeeCode,
                landingFeeTotal,
                goArounds,
                goAroundFeeSingle,
                goAroundFeeCode,
                goAroundFeeTotal
              )
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
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeCode: PropTypes.string,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeCoe: PropTypes.string,
  goAroundFeeTotal: PropTypes.number,
  failure: PropTypes.bool.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  setMethod: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  cancelCardPayment: PropTypes.func.isRequired,
  enabledPaymentMethods: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default PaymentMethod
