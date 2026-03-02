import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
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
    const { t } = this.props;

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
      <LabeledBox label={t('lockMovements.heading')} className="LockMovementsForm">
        <div>
          <p>{t('lockMovements.description')}</p>
          <LabeledComponent label={t('lockMovements.lockDate')} component={datePicker}/>
        </div>
      </LabeledBox>
    );
  }
}

LockMovementsForm.propTypes = {
  lockDate: PropTypes.object.isRequired,
  loadLockDate: PropTypes.func.isRequired,
  setLockDate: PropTypes.func.isRequired,
};

export default withTranslation()(LockMovementsForm);
