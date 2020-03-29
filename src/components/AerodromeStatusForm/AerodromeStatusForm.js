import PropTypes from 'prop-types';
import React from 'react';
import StatusList from "./StatusList"
import StatusForm from "./StatusForm"
import StatusShape from "./StatusShape"

class AerodromeStatusForm extends React.Component {

  componentWillMount() {
    this.props.loadAerodromeStatus();
  }

  render() {
    const {data, disabled, dirty, latest, selected, updateAerodromeStatus, saveAerodromeStatus, selectAerodromeStatus} = this.props;

    return (
      <React.Fragment>
        <StatusForm
          data={data}
          disabled={disabled}
          dirty={dirty}
          updateAerodromeStatus={updateAerodromeStatus}
          saveAerodromeStatus={saveAerodromeStatus}
        />
        {latest.array.length > 0 && (
          <StatusList
            items={latest}
            selected={selected}
            selectStatus={selectAerodromeStatus}
          />)}
      </React.Fragment>
    );
  }
}

AerodromeStatusForm.propTypes = {
  data: PropTypes.shape({
    status: PropTypes.string,
    details: PropTypes.string
  }).isRequired,
  disabled: PropTypes.bool,
  dirty: PropTypes.bool,
  latest: PropTypes.shape({
    array: PropTypes.arrayOf(StatusShape).isRequired
  }).isRequired,
  selected: PropTypes.string,
  loadAerodromeStatus: PropTypes.func.isRequired,
  updateAerodromeStatus: PropTypes.func.isRequired,
  saveAerodromeStatus: PropTypes.func.isRequired,
  selectAerodromeStatus: PropTypes.func.isRequired
};

export default AerodromeStatusForm;
