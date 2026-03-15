import {connect} from 'react-redux';
import MessageList from '../components/MessageList';
import {loadMessages, selectMessage} from '../modules/messages';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  messages: state.messages,
});

const mapActionCreators = {
  loadMessages,
  selectMessage,
};

export default connect(mapStateToProps, mapActionCreators)(MessageList);
