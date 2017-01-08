import React, { Component } from 'react';
import Content from './Content';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import MessageForm from '../MessageForm';
import JumpNavigation from '../JumpNavigation';

const MessagePage = props => (
  <VerticalHeaderLayout>
    <Content>
      <JumpNavigation/>
      <MessageForm
        sent={props.sent}
        commitFailed={props.commitFailed}
        onSubmit={props.saveMessage}
        resetMessageForm={props.resetMessageForm}
        confirmSaveMessageSuccess={props.confirmSaveMessageSuccess}
      />
    </Content>
  </VerticalHeaderLayout>
);

MessagePage.propTypes = {
  sent: React.PropTypes.bool.isRequired,
  commitFailed: React.PropTypes.bool.isRequired,
  saveMessage: React.PropTypes.func.isRequired,
  resetMessageForm: React.PropTypes.func.isRequired,
  confirmSaveMessageSuccess: React.PropTypes.func.isRequired,
};

export default MessagePage;
