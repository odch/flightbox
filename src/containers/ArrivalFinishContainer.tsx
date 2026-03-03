import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {loadUserInvoiceRecipients} from '../modules/invoiceRecipients';
import {createMovementFromMovement} from '../modules/ui/movements';
import {saveMovement} from '../modules/movements';
import Finish, {FinishLoading} from '../components/wizards/ArrivalWizard/Finish';
import {HeadingType} from '../components/wizards/MovementWizard';
import objectToArray from '../util/objectToArray';
import {getEnabledPaymentMethods} from '../util/paymentMethods';
import {RootState} from '../modules';

interface Fees {
  landings: number;
  landingFeeSingle?: number;
  landingFeeCode?: string;
  landingFeeTotal?: number;
  goArounds: number;
  goAroundFeeSingle?: number;
  goAroundFeeCode?: string;
  goAroundFeeTotal?: number;
  totalNet?: number;
  vat?: number;
  roundingDifference?: number;
  totalGross?: number;
}

class ArrivalFinishContainer extends Component<{
  aircraftSettings: {club?: object; homeBase?: object};
  invoiceRecipients?: string[];
  createMovementFromMovement: (key: string, type: string) => void;
  loadAircraftSettings: () => void;
  loadUserInvoiceRecipients: () => void;
  finish: () => void;
  isUpdate?: boolean;
  headingType: string;
  itemKey: string;
  email: string;
  immatriculation: string;
  fees: Fees;
  auth: any;
  localUser: any;
  saveMovement: () => void;
}> {
  componentWillMount() {
    this.props.loadAircraftSettings();
    this.props.loadUserInvoiceRecipients();
  }

  render() {
    const {
      aircraftSettings,
      invoiceRecipients,
      email,
      immatriculation,
      fees,
      createMovementFromMovement,
      finish,
      isUpdate,
      headingType,
      itemKey,
      auth,
      localUser,
    } = this.props;

    if (!aircraftSettings.club || !aircraftSettings.homeBase) {
      return <FinishLoading />;
    }

    if (!invoiceRecipients) {
      return <FinishLoading />;
    }

    const enabledPaymentMethods = getEnabledPaymentMethods(
      objectToArray(__CONF__.paymentMethods),
      auth.data,
    )
      .filter((method: string) => method === 'card' ? localUser : true)
      .filter((method: string) => method === 'invoice' ? invoiceRecipients.length > 0 : true);

    const isHomeBase =
      (aircraftSettings.club as any)[immatriculation] === true ||
      (aircraftSettings.homeBase as any)[immatriculation] === true;

    const FinishAny = Finish as any;
    return (
      <FinishAny
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
        invoiceRecipientNames={invoiceRecipients}
      />
    );
  }
}

const mapStateToProps = (state: RootState, ownProps: any) => {
  const wizardValues = (state.ui.wizard as any).values || {};
  return Object.assign({}, ownProps, {
    aircraftSettings: state.settings.aircrafts,
    invoiceRecipients: state.invoiceRecipients.recipients,
    finish: ownProps.finish,
    isUpdate: ownProps.isUpdate,
    headingType: ownProps.headingType || HeadingType.NONE,
    itemKey: wizardValues.key || (state.ui.wizard as any).itemKey,
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
      totalGross: wizardValues.feeTotalGross,
    },
    auth: state.auth,
    localUser: (state.auth as any).data.local,
    authEmail: (state.auth as any).data.email,
  });
};

const mapActionCreators = {
  createMovementFromMovement,
  loadAircraftSettings,
  loadUserInvoiceRecipients,
  saveMovement,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalFinishContainer);
