import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components'
import Button from '../Button'
import LabeledComponent from '../LabeledComponent';
import TextArea from '../TextArea';
import AerodromeStatusDropdown from './AerodromeStatusDropdown'

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

class StatusForm extends React.Component {

  handleSubmit(e) {
    e.preventDefault();
    this.props.saveAerodromeStatus(this.props.data);
  }

  handleStatusChange(status) {
    this.props.updateAerodromeStatus(status, this.props.data.details);
  }

  handleDetailsChange(e) {
    this.props.updateAerodromeStatus(this.props.data.status, e.target.value);
  }

  render() {
    const {data, disabled, dirty} = this.props;

    const statusDropdown = <AerodromeStatusDropdown value={data.status} onChange={this.handleStatusChange.bind(this)}/>;
    const detailsTextArea = <TextArea value={data.details} rows={6} onChange={this.handleDetailsChange.bind(this)}/>;

    return (
      <StyledForm
        className="AerodromeStatusForm"
        onSubmit={this.handleSubmit.bind(this)}
      >
        <fieldset disabled={disabled}>
          <StyledLabeledComponent label="Status" component={statusDropdown}/>
          <StyledLabeledComponent label="Details" component={detailsTextArea}/>
          <Button
            type="submit"
            label="Speichern"
            icon="save"
            disabled={disabled || !dirty}
            primary/>
        </fieldset>
      </StyledForm>
    );
  }
}

StatusForm.propTypes = {
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
