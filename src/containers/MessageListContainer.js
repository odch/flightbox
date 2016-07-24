import { connect } from 'react-redux';

import MessageList from '../components/MessageList';
import { loadMessages, selectMessage } from '../modules/messages';

const mapStateToProps = state => {
  return {
    messages: state.messages,
  };
};

const mapActionCreators = {
  loadMessages,
  selectMessage,
};

export default connect(mapStateToProps, mapActionCreators)(MessageList);
