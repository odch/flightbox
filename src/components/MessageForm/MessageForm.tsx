import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {Field, Form} from 'react-final-form'
import H1 from '../H1';
import Button from '../Button';
import validate from './validate';
import {renderInputField, renderPhoneField, renderTextArea} from './renderField';
import Intro from './Intro';
import Dialog from './Dialog';

const MessageForm = (props: any) => {
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      props.resetMessageForm();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Form validate={validate} onSubmit={props.onSubmit} initialValues={props.initialValues}>
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
              component={renderPhoneField}
              label={t('message.phone')}
            />
            <Field
              name="message"
              component={renderTextArea}
              label={t('message.message')}
            />
          </div>
          <Button type="submit" icon="send" label={t('message.send')} primary dataCy="send"/>
          {props.sent && (
            <Dialog
              heading={t('message.successHeading')}
              message={t('message.successMessage')}
              onClose={props.confirmSaveMessageSuccess}
            />
          )}
          {props.commitFailed && (
            <Dialog
              heading={t('message.errorHeading')}
              message={t('message.errorMessage')}
              onClose={props.resetMessageForm}
            />
          )}
        </form>
      )}
    </Form>
  );
};

(MessageForm as any).propTypes = {
  sent: PropTypes.bool.isRequired,
  commitFailed: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  resetMessageForm: PropTypes.func.isRequired,
  confirmSaveMessageSuccess: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
};

export default MessageForm;
