import PropTypes from 'prop-types';
import React from 'react';
import {getFromItemKey} from '../../../../util/reference-number';
import {getLandingFeeText} from '../../../../util/landingFees';
import Wrapper from './Wrapper';
import Heading from './Heading';
import Message, {ReferenceNumberMessage} from './Message';
import CashPaymentMessage from './CashPaymentMessage'
import FinishActions from './FinishActions'
import PaymentMethod from '../../../../containers/PaymentMethodContainer'

const getHeading = isUpdate =>
  isUpdate === true
    ? 'Die Ankunft wurde erfolgreich aktualisiert!'
    : 'Ihre Ankunft wurde erfolgreich erfasst!';

const Finish = props => {
  const {
    isUpdate,
    isHomeBase,
    itemKey,
    landings,
    landingFeeSingle,
    landingFeeTotal,
    goArounds,
    goAroundFeeSingle,
    goAroundFeeTotal,
    createMovementFromMovement,
    finish
  } = props

  const heading = getHeading(isUpdate);
  const landingFeeMsg = isHomeBase === false
    ? getLandingFeeText(landings, landingFeeSingle, landingFeeTotal, goArounds, goAroundFeeSingle, goAroundFeeTotal)
    : null;
  const amount =( landingFeeTotal || 0) + (goAroundFeeTotal || 0)

  return (
    <Wrapper>
      <Heading>{heading}</Heading>
      {landingFeeMsg && (
        <>
          <ReferenceNumberMessage>Referenznummer: {getFromItemKey(itemKey)}</ReferenceNumberMessage>
          <Message>Landetaxe: {landingFeeMsg}</Message>
        </>
      )}
      {isHomeBase === false ? (
        __CARD_PAYMENTS_ENABLED__ ? (
          <PaymentMethod itemKey={itemKey} createMovementFromMovement={createMovementFromMovement} finish={finish}
                         amount={amount}/>
        ) : (
          <>
            <CashPaymentMessage itemKey={itemKey}/>
            <FinishActions itemKey={itemKey} createMovementFromMovement={createMovementFromMovement} finish={finish}/>
          </>
        )
      ) : (
        <FinishActions itemKey={itemKey} createMovementFromMovement={createMovementFromMovement} finish={finish}/>
      )}
    </Wrapper>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeTotal: PropTypes.number,
  cardPaymentsEnabled: PropTypes.bool
};

export default Finish;
