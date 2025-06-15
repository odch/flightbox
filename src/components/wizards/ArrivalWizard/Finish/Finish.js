import PropTypes from 'prop-types';
import React from 'react';
import {getFromItemKey} from '../../../../util/reference-number';
import Wrapper from './Wrapper';
import Heading from './Heading';
import {ReferenceNumberMessage} from './Message';
import FinishActions from './FinishActions'
import PaymentMethod from '../../../../containers/PaymentMethodContainer'
import {HeadingType} from '../../MovementWizard'
import Fees from './Fees'

const getHeading = (headingType) =>
  headingType === HeadingType.UPDATED
    ? 'Die Ankunft wurde erfolgreich aktualisiert!'
    : headingType === HeadingType.CREATED
      ? 'Ihre Ankunft wurde erfolgreich erfasst!'
      : undefined;

const Finish = props => {
  const {
    isUpdate,
    headingType,
    isHomeBase,
    itemKey,
    email,
    immatriculation,
    fees,
    enabledPaymentMethods,
    invoiceRecipientName,
    createMovementFromMovement,
    finish
  } = props
  const heading = getHeading(headingType);


  const showPayment = (isHomeBase === false || __CONF__.homebasePayment) && !isUpdate && !!fees

  const {
    landings,
    landingFeeSingle,
    landingFeeCode,
    landingFeeTotal,
    goArounds,
    goAroundFeeSingle,
    goAroundFeeCode,
    goAroundFeeTotal,
    totalGross
  } = fees

  return (
    <Wrapper>
      {heading && <Heading>{heading}</Heading>}
      {showPayment ? (
        <>
          <ReferenceNumberMessage>Referenznummer: {getFromItemKey(itemKey)}</ReferenceNumberMessage>
          <Fees fees={fees}/>
          <PaymentMethod
            itemKey={itemKey}
            email={email}
            immatriculation={immatriculation}
            createMovementFromMovement={createMovementFromMovement}
            finish={finish}
            amount={totalGross}
            landings={landings}
            landingFeeSingle={landingFeeSingle}
            landingFeeCode={landingFeeCode}
            landingFeeTotal={landingFeeTotal}
            goArounds={goArounds}
            goAroundFeeSingle={goAroundFeeSingle}
            goAroundFeeCode={goAroundFeeCode}
            goAroundFeeTotal={goAroundFeeTotal}
            enabledPaymentMethods={enabledPaymentMethods}
            invoiceRecipientName={invoiceRecipientName}
          />
        </>
      ) : (
        <FinishActions itemKey={itemKey} createMovementFromMovement={createMovementFromMovement} finish={finish}/>
      )}
    </Wrapper>
  );
};

const feesShape = PropTypes.shape({
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeCode: PropTypes.string,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeCode: PropTypes.string,
  goAroundFeeTotal: PropTypes.number,
  totalNet: PropTypes.number,
  vat: PropTypes.number,
  roundingDifference: PropTypes.number,
  totalGross: PropTypes.number
})

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool,
  headingType: PropTypes.oneOf(Object.values(HeadingType)).isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  fees: feesShape.isRequired,
  localUser: PropTypes.bool,
  enabledPaymentMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Finish;
