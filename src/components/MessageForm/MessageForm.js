import PropTypes from 'prop-types';
import React from 'react';
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
    return (
      <Form validate={validate} onSubmit={this.props.onSubmit}>
        {({handleSubmit}) => (
          <form className="MessageForm" onSubmit={handleSubmit}>
            <H1>Benachrichtigen Sie uns</H1>
            <Intro>
              Haben Sie Fragen, Anregungen oder ein anderes Anliegen bezüglich
              der Erfassung der Abflüge und Ankünfte, benachrichtigen Sie uns
              bitte über das untenstehende Formular.
            </Intro>
            <div>
              <Field
                name="name"
                type="text"
                component={renderInputField}
                label="Name"
              />
              <Field
                name="email"
                type="email"
                component={renderInputField}
                label="E-Mail"
              />
              <Field
                name="phone"
                type="tel"
                component={renderInputField}
                label="Telefon"
              />
              <Field
                name="message"
                component={renderTextArea}
                label="Nachricht"
              />
            </div>
            <Button type="submit" icon="send" label="Senden" primary/>
            {this.props.sent && (
              <Dialog
                heading="Nachricht gesendet"
                message="Vielen Dank! Ihre Nachricht wurde gesendet."
                onClose={this.props.confirmSaveMessageSuccess}
              />
            )}
            {this.props.commitFailed && (
              <Dialog
                heading="Fehler"
                message="Ihre Nachricht konnte nicht gesendet werden."
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

export default MessageForm;
