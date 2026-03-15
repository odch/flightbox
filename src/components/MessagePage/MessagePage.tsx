import PropTypes from 'prop-types';
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
  sent: PropTypes.bool.isRequired,
  commitFailed: PropTypes.bool.isRequired,
  saveMessage: PropTypes.func.isRequired,
  resetMessageForm: PropTypes.func.isRequired,
  confirmSaveMessageSuccess: PropTypes.func.isRequired,
};

export default MessagePage;
