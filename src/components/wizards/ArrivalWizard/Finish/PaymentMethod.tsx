import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useTranslation} from 'react-i18next'
import styled from 'styled-components'
import {Step} from '../../../../modules/ui/arrivalPayment'
import SingleSelect from '../../../SingleSelect'
import {CancelButton, NextButton} from '../../../WizardNavigation'
import CashPaymentMessage from './CashPaymentMessage'
import FinishActions from './FinishActions'
import TwintPaymentMessage from './TwintPaymentMessage'
import {useLocation} from 'react-router-dom'
import {getFromItemKey} from '../../../../util/reference-number'
import {PAYMENT_METHODS} from '../../../../util/paymentMethods'
import CardExternalPaymentMessage from './CardExternalPaymentMessage'
import Heading from './Heading'
import Centered from '../../../Centered'
import MaterialIcon from '../../../MaterialIcon'

const Container = styled.div`
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

const PaymentMethod = (props: any) => {
  const {t} = useTranslation();
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);

  const {
    itemKey,
    method,
    step,
    failure,
    createMovementFromMovement,
    finish,
    setMethod,
    cancelCardPayment,
    enabledPaymentMethods,
    invoiceRecipientNames,
  } = props;

  const confirmMethod = (selectedMethod: string) => {
    if (!selectedMethod) {
      return;
    }

    const {
      email,
      immatriculation,
      amount,
      landings,
      landingFeeSingle,
      landingFeeCode,
      landingFeeTotal,
      goArounds,
      goAroundFeeSingle,
      goAroundFeeCode,
      goAroundFeeTotal,
      createCardPayment,
      setStep,
      saveMovementPaymentMethod,
    } = props;

    const paymentMethodData: any = {
      method: selectedMethod,
    };

    if (['cash', 'twint_external', 'card_external'].includes(selectedMethod)) {
      setStep(Step.COMPLETED);
    } else if (selectedMethod.startsWith('invoice')) {
      paymentMethodData.method = 'invoice';
      paymentMethodData.invoiceRecipientName = selectedMethod.substring(selectedMethod.indexOf('[') + 1, selectedMethod.indexOf(']'));
      setStep(Step.COMPLETED);
    } else if (selectedMethod === 'card') {
      setStep(Step.CONFIRMED);
      createCardPayment(
        itemKey,
        getFromItemKey(itemKey),
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
      );
    } else if (selectedMethod === 'checkout') {
      paymentMethodData.status = 'pending';
      setStep(Step.CONFIRMED);
      createCardPayment(
        itemKey,
        getFromItemKey(itemKey),
        amount,
        'CHF',
        'checkout',
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
      );
    }

    saveMovementPaymentMethod('arrival', itemKey, paymentMethodData);
  };

  useEffect(() => {
    // set to completed if success message from online checkout
    const query = new URLSearchParams(location.search);
    const successParam = query.get('success');
    if (successParam === 'true') {
      props.setMethod('checkout');
      props.setStep(Step.COMPLETED);
      setInitialized(true);
      return;
    }

    // continue with only enabled payment method if only one
    if (enabledPaymentMethods.length === 1) {
      const onlyMethod = enabledPaymentMethods[0];
      props.setMethod(onlyMethod);
      confirmMethod(onlyMethod);
    }

    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized) {
    return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}</Centered>;
  }

  const availableMethods = PAYMENT_METHODS
    .filter(m => enabledPaymentMethods.includes(m.value) && m.value !== 'invoice')
    .map(m => ({
      ...m,
      label: m.value === 'checkout'
        ? t('arrival.payment.checkoutCta')
        : t(`paymentMethods.${m.value}`)
    }));

  if (enabledPaymentMethods.includes('invoice')) {
    for (const invoiceRecipientName of invoiceRecipientNames) {
      availableMethods.push({
        value: `invoice[${invoiceRecipientName}]`,
        label: t('arrival.payment.invoice', {recipient: invoiceRecipientName})
      });
    }
  }

  return (
    <Container>
      {failure && (
        <FailureMessage>{t('arrival.payment.failure')}</FailureMessage>
      )}
      {step === Step.COMPLETED ? (
        <>
          {method === 'cash' ? (
            <CashPaymentMessage itemKey={itemKey}/>
          ) : method === 'twint_external' ? (
            <TwintPaymentMessage {...{itemKey} as any}/>
          ) : method === 'card_external' ? (
            <CardExternalPaymentMessage {...{itemKey} as any}/>
          ) : method === 'checkout' ? (
            <Heading>{t('arrival.payment.success')}</Heading>
          ) : null}
          <FinishActions itemKey={itemKey}
                         createMovementFromMovement={createMovementFromMovement}
                         finish={finish}/>
        </>
      ) : step === Step.CONFIRMED ? (
        method === 'card' ? (
          <>
            <InstructionMessage>{t('arrival.payment.cardInstruction')}</InstructionMessage>
            <StyledCancelButton
              type="button"
              label={t('arrival.payment.cancel')}
              onClick={() => {
                cancelCardPayment()
              }}
            />
          </>
        ) : method === 'checkout' ? (
          <>
            <>
              <InstructionMessage>{t('arrival.payment.redirect')}</InstructionMessage>
            </>
          </>
        ) : null
      ) : (<>
          <InstructionMessage>{t('arrival.payment.selectMethod')}</InstructionMessage>
          <SelectContainer>
            <SingleSelect
              items={availableMethods}
              orientation="vertical"
              onChange={e => setMethod(e.target.value)}
              value={method}
            />
          </SelectContainer>
          <StyledNextButton
            type="submit"
            label={t('arrival.payment.next')}
            icon="navigate_next"
            onClick={() => confirmMethod(method)}
            dataCy="next-button"
            primary
            disabled={!method}
          />
        </>
      )}
    </Container>
  );
};

(PaymentMethod as any).propTypes = {
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
  enabledPaymentMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  setMethod: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  cancelCardPayment: PropTypes.func.isRequired,
  saveMovementPaymentMethod: PropTypes.func.isRequired
};

export default PaymentMethod;
