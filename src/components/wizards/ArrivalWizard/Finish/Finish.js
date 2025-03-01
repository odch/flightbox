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
import objectToArray from '../../../../util/objectToArray'

const getHeading = isUpdate =>
  isUpdate === true
    ? 'Die Ankunft wurde erfolgreich aktualisiert!'
    : 'Ihre Ankunft wurde erfolgreich erfasst!';

const Finish = props => {
  const {
    isUpdate,
    isHomeBase,
    itemKey,
    email,
    immatriculation,
    landings,
    landingFeeSingle,
    landingFeeCode,
    landingFeeTotal,
    goArounds,
    goAroundFeeSingle,
    goAroundFeeCode,
    goAroundFeeTotal,
    localUser,
    createMovementFromMovement,
    finish
  } = props

  const enabledPaymentMethods = objectToArray(__CONF__.paymentMethods).filter(method => method === 'card' ? localUser : true);

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
        enabledPaymentMethods.length > 1 ? (
          <PaymentMethod
            itemKey={itemKey}
            email={email}
            immatriculation={immatriculation}
            createMovementFromMovement={createMovementFromMovement}
            finish={finish}
            amount={amount}
            landings={landings}
            landingFeeSingle={landingFeeSingle}
            landingFeeCode={landingFeeCode}
            landingFeeTotal={landingFeeTotal}
            goArounds={goArounds}
            goAroundFeeSingle={goAroundFeeSingle}
            goAroundFeeCode={goAroundFeeCode}
            goAroundFeeTotal={goAroundFeeTotal}
            enabledPaymentMethods={enabledPaymentMethods}
          />
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
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeCode: PropTypes.string,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeCode: PropTypes.string,
  goAroundFeeTotal: PropTypes.number,
  localUser: PropTypes.bool,
};

export default Finish;
