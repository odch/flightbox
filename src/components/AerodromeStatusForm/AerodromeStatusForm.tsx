import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import StatusList from "./StatusList"
import StatusForm from "./StatusForm"
import StatusShape from "./StatusShape"

const AerodromeStatusForm = (props: any) => {
  useEffect(() => {
    props.loadAerodromeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {data, disabled, dirty, latest, selected, updateAerodromeStatus, saveAerodromeStatus, selectAerodromeStatus} = props;

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
};

(AerodromeStatusForm as any).propTypes = {
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
