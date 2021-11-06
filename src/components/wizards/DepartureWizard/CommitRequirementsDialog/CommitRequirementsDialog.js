import PropTypes from 'prop-types';
import React from 'react';
import objectToArray from "../../../../util/objectToArray"
import ModalDialog from '../../../ModalDialog';
import Heading from './Heading';
import Items from './Items';
import Item from './Item';
import CancelButton from './CancelButton';
import ConfirmButton from './ConfirmButton';

const CommitRequirementsDialog = props => {
  const content = (
    <div>
      <Heading>Bitte bestätigen</Heading>
      <Items>
        {objectToArray(__CONF__.departureCommitRequirements).map((req, index) => (
          <Item key={index}>{req}</Item>
        ))}
      </Items>
      <div>
        <ConfirmButton
          label="Bestätigen"
          icon="done_all"
          onClick={props.onConfirm}
          dataCy="commit-requirement-dialog-confirm"
          primary
        />
        <CancelButton label="Abbrechen" onClick={props.onCancel}/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onCancel} fullWidthThreshold={800}/>;
};

CommitRequirementsDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CommitRequirementsDialog;
