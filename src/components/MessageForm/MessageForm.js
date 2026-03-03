import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import {Field, Form} from 'react-final-form'
import H1 from '../H1';
import Button from '../Button';
import validate from './validate.js';
import {renderInputField, renderTextArea} from './renderField';
import Intro from './Intro';
import Dialog from './Dialog';

class MessageForm extends React.Component {

  componentWillUnmount() {
    this.props.resetMessageForm();
  }

  render() {
    const { t } = this.props;
    return (
      <Form validate={validate} onSubmit={this.props.onSubmit}>
        {({handleSubmit}) => (
          <form className="MessageForm" onSubmit={handleSubmit}>
            <H1>{t('message.heading')}</H1>
            <Intro>
              {t('message.intro')}
            </Intro>
            <div>
              <Field
                name="name"
                type="text"
                component={renderInputField}
                label={t('message.name')}
              />
              <Field
                name="email"
                type="email"
                component={renderInputField}
                label={t('message.email')}
              />
              <Field
                name="phone"
                type="tel"
                component={renderInputField}
                label={t('message.phone')}
              />
              <Field
                name="message"
                component={renderTextArea}
                label={t('message.message')}
              />
            </div>
            <Button type="submit" icon="send" label={t('message.send')} primary dataCy="send"/>
            {this.props.sent && (
              <Dialog
                heading={t('message.successHeading')}
                message={t('message.successMessage')}
                onClose={this.props.confirmSaveMessageSuccess}
              />
            )}
            {this.props.commitFailed && (
              <Dialog
                heading={t('message.errorHeading')}
                message={t('message.errorMessage')}
                onClose={this.props.resetMessageForm}
              />
            )}
          </form>
        )}
      </Form>
    );
  }
}

MessageForm.propTypes = {
  sent: PropTypes.bool.isRequired,
  commitFailed: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  resetMessageForm: PropTypes.func.isRequired,
  confirmSaveMessageSuccess: PropTypes.func.isRequired,
};

export default withTranslation()(MessageForm);
