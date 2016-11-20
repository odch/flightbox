import React from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from './validate.js';
import { renderInputField, renderTextArea } from '../../util/renderField';
import MessageSentDialog from './MessageSentDialog';
import CommitErrorDialog from './CommitErrorDialog';
import './MessageForm.scss';

class MessageForm extends React.Component {

  componentWillUnmount() {
    this.props.resetMessageForm();
  }

  render() {
    return (
      <form className="MessageForm" onSubmit={this.props.handleSubmit}>
        <h1>Benachrichtigen Sie uns</h1>
        <div className="intro">
          Haben Sie Fragen, Anregungen oder ein anderes Anliegen bezüglich
          der Erfassung der Abflüge und Ankünfte, benachrichtigen Sie uns
          bitte über das untenstehende Formular.
        </div>
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
        <button type="submit" className="send">
          <i className="material-icons">send</i>&nbsp;Senden
        </button>
        {this.props.sent && <MessageSentDialog onClose={this.props.confirmSaveMessageSuccess}/>}
        {this.props.commitFailed && <CommitErrorDialog onClose={this.props.resetMessageForm}/>}
      </form>
    );
  }
}

MessageForm.propTypes = {
  sent: React.PropTypes.bool.isRequired,
  commitFailed: React.PropTypes.bool.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  resetMessageForm: React.PropTypes.func.isRequired,
  confirmSaveMessageSuccess: React.PropTypes.func.isRequired,
};

export default reduxForm({
  form: 'message',
  validate,
})(MessageForm);
