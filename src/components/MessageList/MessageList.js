import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MessageShape from './MessageShape';
import MessagesWrapper from './MessagesWrapper';
import Message from './Message';
import MessageHeader from './MessageHeader';
import MessageContent from './MessageContent';
import Empty from './Empty';

class MessageList extends Component {

  componentWillMount() {
    this.props.loadMessages();
  }

  render() {
    if (this.props.messages.data.array.length === 0) {
      return <Empty>Keine Nachrichten</Empty>;
    }

    return (
      <MessagesWrapper>
        {this.props.messages.data.array.map((item, index) => {
          const isSelected = this.props.messages.selected === item.key;
          return (
            <Message
              key={index}
              selected={isSelected}
              onClick={this.handleMessageClick.bind(this, item.key)}
            >
              <MessageHeader item={item} selected={isSelected}/>
              {isSelected && <MessageContent item={item}/>}
            </Message>
          );
        })}
      </MessagesWrapper>
    );
  }

  handleMessageClick(key) {
    this.props.selectMessage(this.props.messages.selected === key ? null : key);
  }
}

MessageList.propTypes = {
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
