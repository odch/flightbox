import {connect} from 'react-redux';
import PaymentMethod from '../components/wizards/ArrivalWizard/Finish/PaymentMethod';
import {cancelCardPayment, createCardPayment, setMethod, setStep} from '../modules/ui/arrivalPayment';
import {saveMovementPaymentMethod} from '../modules/movements';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  method: state.ui.arrivalPayment.method,
  step: state.ui.arrivalPayment.step,
  failure: state.ui.arrivalPayment.failure,
});

const mapActionCreators = {
  setMethod,
  setStep,
  createCardPayment,
  cancelCardPayment,
  saveMovementPaymentMethod,
};

export default connect(mapStateToProps, mapActionCreators)(PaymentMethod);
