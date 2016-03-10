import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import LabeledBox from '../LabeledBox';
import DatePicker from '../DatePicker';
import Firebase from 'firebase';
import Config from 'Config';
import './LockMovementsForm.scss';

class LockMovementsForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      date: null,
      changed: false,
    };
  }

  componentWillMount() {
    new Firebase(Config.firebaseUrl + '/settings/lockDate')
      .once('value', this.onFirebaseValue, this);
  }

  onFirebaseValue(snapshot) {
    this.setState({
      date: snapshot.val(),
    });
  }

  render() {
    const datePicker = (
      <DatePicker
        value={this.state.date}
        onChange={(e) => this.setState({
          date: e.value,
          changed: true,
        })}
        clearable={true}
      />
    );

    return (
      <LabeledBox label="Erfasste Bewegungen sperren" className="LockMovementsForm">
        <div>
          <p>Alle Bewegungen, die bis und mit dem gewählten Sperrdatum stattgefunden haben, können nicht
          bearbeitet oder gelöscht werden.</p>
          <LabeledComponent label="Sperrdatum" component={datePicker}/>
        </div>
        {this.state.changed === true
          ? (
            <button
              onClick={this.saveClickHandler.bind(this)}
              className="save"
            >
              <i className="material-icons">save</i>&nbsp;Speichern
            </button>)
          : (
            <button
              onClick={this.saveClickHandler.bind(this)}
              className="save"
              disabled="disabled"
            >
              <i className="material-icons">save</i>&nbsp;Speichern
            </button>)
        }
      </LabeledBox>
    );
  }

  saveClickHandler() {
    new Firebase(Config.firebaseUrl + '/settings/lockDate').set(this.state.date, () => {
      this.setState({
        changed: false,
      });
    });
  }
}

export default LockMovementsForm;
