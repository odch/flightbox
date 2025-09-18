import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {loadInvoiceRecipientSettings} from '../modules/settings/invoiceRecipients';
import {createMovementFromMovement} from '../modules/ui/movements';
import {saveMovement} from '../modules/movements';
import Finish, {FinishLoading} from '../components/wizards/ArrivalWizard/Finish';
import {HeadingType} from '../components/wizards/MovementWizard'
import objectToArray from '../util/objectToArray'

const findInvoiceRecipients = (invoiceRecipients, authEmail) => {
  if (!invoiceRecipients || !invoiceRecipients.loaded || invoiceRecipients.recipients.length === 0) {
    return null
  }

  const matchingRecipients = []

  for (const invoiceRecipient of invoiceRecipients.recipients) {
    if (invoiceRecipient.emails && invoiceRecipient.emails.includes(authEmail)) {
      matchingRecipients.push(invoiceRecipient)
    }
  }

  return matchingRecipients
}

class ArrivalFinishContainer extends Component {

  componentWillMount() {
    this.props.loadAircraftSettings();
    this.props.loadInvoiceRecipientSettings();
  }

  render() {
    const {
      aircraftSettings,
      invoiceRecipientSettings,
      email, // pilot email (also see `authEmail`)
      immatriculation,
      fees,
      createMovementFromMovement,
      finish,
      isUpdate,
      headingType,
      itemKey,
      localUser,
      authEmail
    } = this.props

    if (!aircraftSettings.club || !aircraftSettings.homeBase) {
      return (
        <FinishLoading/>
      );
    }

    if (!invoiceRecipientSettings.loaded) {
      return (
        <FinishLoading/>
      );
    }

    const invoiceRecipients = findInvoiceRecipients(invoiceRecipientSettings, authEmail)

    const enabledPaymentMethods = objectToArray(__CONF__.paymentMethods)
      .filter(method => method === 'card' ? localUser : true)
      .filter(method => method === 'invoice' ? invoiceRecipients.length > 0 : true);

    const isHomeBase = aircraftSettings.club[immatriculation] === true
        || aircraftSettings.homeBase[immatriculation] === true;

    return (
      <Finish
        createMovementFromMovement={createMovementFromMovement}
        finish={finish}
        isUpdate={isUpdate}
        headingType={headingType}
        email={email}
        immatriculation={immatriculation}
        isHomeBase={isHomeBase}
        itemKey={itemKey}
        fees={fees}
        localUser={localUser}
        enabledPaymentMethods={enabledPaymentMethods}
        invoiceRecipientNames={invoiceRecipients ? invoiceRecipients.map(recipient => recipient.name) : []}
      />
    );
  }
}

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

ArrivalFinishContainer.propTypes = {
  aircraftSettings: PropTypes.shape({
    club: PropTypes.object,
    homeBase: PropTypes.object,
  }).isRequired,
  invoiceRecipientSettings: PropTypes.shape({
    loaded: PropTypes.bool.isRequired,
    recipients: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      emails: PropTypes.arrayOf(PropTypes.string)
    })).isRequired
  }),
  createMovementFromMovement: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,
  loadInvoiceRecipientSettings: PropTypes.func.isRequired,

  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool,
  headingType: PropTypes.oneOf(Object.values(HeadingType)).isRequired,
  itemKey: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  fees: feesShape.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const wizard = state.form.wizard || {}
  const wizardValues = wizard.values || {}
  return Object.assign({}, ownProps, {
    aircraftSettings: state.settings.aircrafts,
    invoiceRecipientSettings: state.settings.invoiceRecipients,
    finish: ownProps.finish,
    isUpdate: ownProps.isUpdate,
    headingType: ownProps.headingType || HeadingType.NONE,
    itemKey: wizardValues.key || state.ui.wizard.itemKey,
    email: wizardValues.email,
    immatriculation: wizardValues.immatriculation,
    fees: {
      landings: wizardValues.landingCount,
      landingFeeSingle: wizardValues.landingFeeSingle,
      landingFeeCode: wizardValues.landingFeeCode,
      landingFeeTotal: wizardValues.landingFeeTotal,
      goArounds: wizardValues.goAroundCount,
      goAroundFeeSingle: wizardValues.goAroundFeeSingle,
      goAroundFeeCode: wizardValues.goAroundFeeCode,
      goAroundFeeTotal: wizardValues.goAroundFeeTotal,
      totalNet: wizardValues.feeTotalNet,
      vat: wizardValues.feeVat,
      roundingDifference: wizardValues.feeRoundingDifference,
      totalGross: wizardValues.feeTotalGross
    },
    localUser: state.auth.data.local,
    authEmail: state.auth.data.email,
  });
};

const mapActionCreators = {
  createMovementFromMovement,
  loadAircraftSettings,
  loadInvoiceRecipientSettings,
  saveMovement
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalFinishContainer);
