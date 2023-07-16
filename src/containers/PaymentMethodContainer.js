import {connect} from 'react-redux';
import PaymentMethod from '../components/wizards/ArrivalWizard/Finish/PaymentMethod'
import {createCardPayment, setMethod, setStep, cancelCardPayment} from '../modules/ui/arrivalPayment'

const mapStateToProps = state => ({
  method: state.ui.arrivalPayment.method,
  step: state.ui.arrivalPayment.step,
  failure: state.ui.arrivalPayment.failure
})

const mapActionCreators = {
  setMethod,
  setStep,
  createCardPayment,
  cancelCardPayment
};

export default connect(mapStateToProps, mapActionCreators)(PaymentMethod)
