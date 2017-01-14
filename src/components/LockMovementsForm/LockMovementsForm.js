import React, { Component } from 'react';
import LabeledComponent from './StyledLabeledComponent';
import LabeledBox from '../LabeledBox';
import DatePicker from '../DatePicker';
import moment from 'moment';

class LockMovementsForm extends Component {

  componentWillMount() {
    this.props.loadLockDate();
  }

  render() {
    const { lockDate } = this.props;

    const datePicker = (
      <DatePicker
        value={lockDate.date ? moment(lockDate.date).format('YYYY-MM-DD') : null}
        onChange={(e) => {
          const ms = e.value ? new Date(e.value).getTime() : null;
          this.props.setLockDate(ms);
        }}
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
      </LabeledBox>
    );
  }
}

LockMovementsForm.propTypes = {
  lockDate: React.PropTypes.object.isRequired,
  loadLockDate: React.PropTypes.func.isRequired,
  setLockDate: React.PropTypes.func.isRequired,
};

export default LockMovementsForm;
