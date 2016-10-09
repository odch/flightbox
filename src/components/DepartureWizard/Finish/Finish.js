import React, { PropTypes } from 'react';
import './Finish.scss';
import ImageButton from '../../ImageButton';

const getMessage = isUpdate =>
  isUpdate === true
    ? 'Der Abflug wurde erfolgreich aktualisiert!'
    : 'Ihr Abflug wurde erfolgreich erfasst!';

const Finish = props => {
  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  return (
    <div className="Finish">
      <div className="msg">{getMessage(props.isUpdate)}</div>
      <ImageButton label="Beenden" img={exitImagePath} onClick={props.finish}/>
    </div>
  );
};

Finish.propTypes = {
  finish: PropTypes.func,
  isUpdate: PropTypes.bool,
};

export default Finish;
