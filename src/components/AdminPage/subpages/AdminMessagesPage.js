import React from 'react';
import LabeledBox from '../../LabeledBox';
import MessageList from '../../../containers/MessageListContainer';

const AdminMessagesPage = () => {
  return (
    <LabeledBox label="Nachrichten" className="messages" contentPadding={0}>
      <MessageList/>
    </LabeledBox>
  );
};

export default AdminMessagesPage;
