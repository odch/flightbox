import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import ModalDialog from '../ModalDialog';
import firebase from '../../util/firebase.js';
import update from 'react-addons-update';
import validate from '../../util/validate.js';
import './MessageForm.scss';

class MessageForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: {},
      sent: false,
      validationErrors: [],
    };
    this.validationConfig = {
      name: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier Ihren Namen ein.',
      },
      phone: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier Ihre Telefonnummer ein.',
      },
      email: {
        types: {
          required: true,
          match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        },
        message: 'Geben Sie hier Ihre E-Mail-Adresse ein.',
      },
      message: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier Ihre Nachricht ein.',
      },
    };
  }

  updateData(e) {
    const name = e.target.name;
    const value = e.target.value;

    const data = update(this.state.data, {
      [name]: { $set: value },
    });

    this.setState({
      data,
    }, () => {
      if (this.state.showValidationErrors === true) {
        this.validate();
      }
    });
  }

  render() {
    const messageSentDialog = this.getMessageSentDialog();
    const commitErrorDialog = this.getCommitErrorDialog();

    const nameField = (
      <input
        name="name"
        type="text"
        onChange={this.updateData.bind(this)}
      />
    );
    const emailField = (
      <input
        name="email"
        type="email"
        onChange={this.updateData.bind(this)}
      />
    );
    const phoneField = (
      <input
        name="phone"
        type="tel"
        onChange={this.updateData.bind(this)}
      />
    );
    const messageField = (
      <textarea
        name="message"
        rows="10"
        onChange={this.updateData.bind(this)}
      />
    );

    return (
      <div className="MessageForm">
        <h1>Benachrichtigen Sie uns</h1>
        <div className="intro">
          Haben Sie Fragen, Anregungen oder ein anderes Anliegen bezüglich
          der Erfassung der Abflüge und Ankünfte, benachrichtigen Sie uns
          bitte über das untenstehende Formular.
        </div>
        <div>
          <LabeledComponent
            label="Name"
            component={nameField}
            validationError={this.getValidationError('name')}
          />
          <LabeledComponent
            label="E-Mail"
            component={emailField}
            validationError={this.getValidationError('email')}
          />
          <LabeledComponent
            label="Telefon"
            component={phoneField}
            validationError={this.getValidationError('phone')}
          />
          <LabeledComponent
            label="Nachricht"
            component={messageField}
            validationError={this.getValidationError('message')}
          />
        </div>
        <button
          onClick={this.buttonClickHandler.bind(this)}
          className="send"
        >
          <i className="material-icons">send</i>&nbsp;Senden
        </button>
        {commitErrorDialog}
        {messageSentDialog}
      </div>
    );
  }

  getMessageSentDialog() {
    if (this.state.sent === true) {
      const content = (
        <div>
          <div className="heading">Nachricht gesendet</div>
          <div className="message">Vielen Dank! Ihre Nachricht wurde gesendet.</div>
          <button className="close" onClick={this.closeSentDialogHandler.bind(this)}><i className="material-icons">close</i>&nbsp;Schliessen</button>
        </div>
      );
      return (
        <ModalDialog
          content={content}
          onBlur={this.closeSentDialogHandler.bind(this)}
        />
      );
    }
    return null;
  }

  getCommitErrorDialog() {
    if (this.state.commitError) {
      const content = (
        <div>
          <div className="heading">Fehler</div>
          <div className="message">Ihre Nachricht konnte nicht gesendet werden.</div>
          <button className="close" onClick={this.closeErrorHandler.bind(this)}><i className="material-icons">close</i>&nbsp;Schliessen</button>
        </div>
      );
      return (
        <ModalDialog
          content={content}
          onBlur={this.closeErrorHandler.bind(this)}
        />
      );
    }
    return null;
  }

  buttonClickHandler() {
    const valid = this.validate();
    if (valid === true) {
      const timestamp = new Date().getTime();
      const withDate = update(this.state.data, {
        timestamp: { $set: timestamp },
        negativeTimestamp: { $set: timestamp * -1 },
      });
      firebase('/messages/', (error, ref) => {
        ref.push(withDate, commitError => {
          if (error) {
            this.setState({
              commitError,
            });
          } else {
            this.setState({
              sent: true,
            });
          }
        });
      });
    } else {
      this.setState({
        showValidationErrors: true,
      });
    }
  }

  validate() {
    const validationErrors = validate(this.state.data, this.validationConfig);
    this.setState({
      validationErrors,
    });
    return validationErrors.length === 0;
  }

  getValidationError(key) {
    if (this.state.showValidationErrors === true) {
      const error = this.state.validationErrors.find(validationError => validationError.key === key);
      if (error) {
        return error.message;
      }
    }
    return null;
  }

  closeErrorHandler() {
    this.setState({
      commitError: null,
    });
  }

  closeSentDialogHandler() {
    window.location.hash = '/';
  }
}

export default MessageForm;
