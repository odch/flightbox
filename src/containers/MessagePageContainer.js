import { connect } from 'react-redux';
import { saveMessage, resetMessageForm, confirmSaveMessageSuccess } from '../modules/messages';
import MessagePage from '../components/MessagePage';

const mapStateToProps = state => {
  return {
    sent: state.messages.form.sent,
    commitFailed: state.messages.form.commitFailed,
  };
};

const mapActionCreators = {
  saveMessage,
  resetMessageForm,
  confirmSaveMessageSuccess,
};

export default connect(mapStateToProps, mapActionCreators)(MessagePage);
