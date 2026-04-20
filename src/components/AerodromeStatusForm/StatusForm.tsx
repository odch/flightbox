import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components'
import Button from '../Button'
import LabeledComponent from '../LabeledComponent';
import TextArea from '../TextArea';
import AerodromeStatusDropdown from './AerodromeStatusDropdown'
import { useTranslation } from 'react-i18next'

const StyledForm = styled.form`
  padding: 1em
`;

const StyledLabeledComponent = styled(LabeledComponent)`
  width: 50%;
  margin-bottom: 1.5em;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StatusForm = (props: any) => {
  const { t } = useTranslation();
  const { data, disabled, dirty } = props;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    props.saveAerodromeStatus(data);
  };

  const handleStatusChange = (status: string) => {
    props.updateAerodromeStatus(status, data.details);
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.updateAerodromeStatus(data.status, e.target.value);
  };

  const statusDropdown = (
    <AerodromeStatusDropdown value={data.status} onChange={handleStatusChange}/>
  );
  const detailsTextArea = (
    <TextArea value={data.details} rows={6} onChange={handleDetailsChange}/>
  );

  return (
    <StyledForm
      className="AerodromeStatusForm"
      onSubmit={handleSubmit}
    >
      <fieldset disabled={disabled}>
        <StyledLabeledComponent label={t('common.status')} component={statusDropdown}/>
        <StyledLabeledComponent label={t('common.details')} component={detailsTextArea}/>
        <Button
          type="submit"
          label={t('common.save')}
          icon="save"
          disabled={disabled || !dirty}
          primary/>
      </fieldset>
    </StyledForm>
  );
};

(StatusForm as any).propTypes = {
  data: PropTypes.shape({
    status: PropTypes.string,
    details: PropTypes.string
  }).isRequired,
  dirty: PropTypes.bool,
  disabled: PropTypes.bool,
  updateAerodromeStatus: PropTypes.func.isRequired,
  saveAerodromeStatus: PropTypes.func.isRequired
};

export default StatusForm;
