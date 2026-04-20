import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MessageShape from './MessageShape';
import MessagesWrapper from './MessagesWrapper';
import Message from './Message';
import MessageHeader from './MessageHeader';
import MessageContent from './MessageContent';
import Empty from './Empty';

const MessageList = (props: any) => {
  const { t } = useTranslation();

  useEffect(() => {
    props.loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessageClick = (key: string) => {
    props.selectMessage(props.messages.selected === key ? null : key);
  };

  if (props.messages.data.array.length === 0) {
    return <Empty>{t('message.noMessages')}</Empty>;
  }

  return (
    <MessagesWrapper>
      {props.messages.data.array.map((item: any, index: number) => {
        const isSelected = props.messages.selected === item.key;
        return (
          <Message
            key={index}
            $selected={isSelected}
            onClick={() => handleMessageClick(item.key)}
          >
            <MessageHeader item={item} selected={isSelected}/>
            {isSelected && <MessageContent item={item}/>}
          </Message>
        );
      })}
    </MessagesWrapper>
  );
};

(MessageList as any).propTypes = {
  messages: PropTypes.shape({
    data: PropTypes.shape({
      array: PropTypes.arrayOf(MessageShape).isRequired,
    }),
    selected: PropTypes.string
  }).isRequired,
  loadMessages: PropTypes.func.isRequired,
  selectMessage: PropTypes.func.isRequired,
};

export default MessageList;
