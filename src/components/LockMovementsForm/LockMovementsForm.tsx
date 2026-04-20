import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LabeledComponent from './StyledLabeledComponent';
import LabeledBox from '../LabeledBox';
import DatePicker from '../DatePicker';
import moment from 'moment';

const LockMovementsForm = (props: any) => {
  const { t } = useTranslation();
  const { lockDate } = props;

  useEffect(() => {
    props.loadLockDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datePicker = (
    <DatePicker
      value={lockDate.date ? moment(lockDate.date).format('YYYY-MM-DD') : null}
      onChange={(e: any) => {
        const ms = e.value ? new Date(e.value).getTime() : null;
        props.setLockDate(ms);
      }}
      clearable={true}
      dataCy="lock-date"
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
};

(LockMovementsForm as any).propTypes = {
  lockDate: PropTypes.object.isRequired,
  loadLockDate: PropTypes.func.isRequired,
  setLockDate: PropTypes.func.isRequired,
};

export default LockMovementsForm;
