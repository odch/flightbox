import React from 'react';
import LabeledBox from '../../LabeledBox';
import MessageList from '../../../containers/MessageListContainer';
import { useTranslation } from 'react-i18next';

const AdminMessagesPage = () => {
  const { t } = useTranslation();
  return (
    <LabeledBox label={t('admin.messages')} className="messages" contentPadding={0}>
      <MessageList/>
    </LabeledBox>
  );
};

export default AdminMessagesPage;
