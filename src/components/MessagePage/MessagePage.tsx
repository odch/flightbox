import PropTypes from 'prop-types';
import React from 'react';
import Content from './Content';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import MessageForm from '../MessageForm';
import JumpNavigation from '../JumpNavigation';

export const getInitialValues = (profile: any, auth: any) => {
  const p = profile || {};
  const values: Record<string, string> = {};

  const firstname = p.firstname || '';
  const lastname = p.lastname || '';
  const name = `${firstname} ${lastname}`.trim();
  if (name) values.name = name;

  const email = p.email || (auth && auth.email);
  if (email) values.email = email;

  if (p.phone) values.phone = p.phone;

  return values;
};

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
        initialValues={getInitialValues(props.profile, props.auth)}
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
  profile: PropTypes.object,
  auth: PropTypes.object,
};

export default MessagePage;
