import {connect} from 'react-redux';
import {saveMessage, resetMessageForm, confirmSaveMessageSuccess} from '../modules/messages';
import MessagePage from '../components/MessagePage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  sent: state.messages.form.sent,
  commitFailed: state.messages.form.commitFailed,
});

const mapActionCreators = {
  saveMessage,
  resetMessageForm,
  confirmSaveMessageSuccess,
};

export default connect(mapStateToProps, mapActionCreators)(MessagePage);
