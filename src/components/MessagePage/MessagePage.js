import React, { Component } from 'react';
import './MessagePage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import MessageForm from '../MessageForm';
import JumpNavigation from '../JumpNavigation';
import Logo from '../Logo';

class MessagePage extends Component {

  render() {
    return (
      <BorderLayout className="MessagePage">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <Logo className="logo"/>
            </a>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          <JumpNavigation/>
          <MessageForm
            sent={this.props.sent}
            commitFailed={this.props.commitFailed}
            onSubmit={this.props.saveMessage}
            resetMessageForm={this.props.resetMessageForm}
            confirmSaveMessageSuccess={this.props.confirmSaveMessageSuccess}
          />
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

MessagePage.propTypes = {
  sent: React.PropTypes.bool.isRequired,
  commitFailed: React.PropTypes.bool.isRequired,
  saveMessage: React.PropTypes.func.isRequired,
  resetMessageForm: React.PropTypes.func.isRequired,
  confirmSaveMessageSuccess: React.PropTypes.func.isRequired,
};

export default MessagePage;
