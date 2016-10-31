import React, { PropTypes } from 'react';
import './Finish.scss';
import ImageButton from '../../../ImageButton';
import { getFromItemKey } from '../../../../util/reference-number';

const getHeading = isUpdate =>
  isUpdate === true
    ? 'Die Ankunft wurde erfolgreich aktualisiert!'
    : 'Ihre Ankunft wurde erfolgreich erfasst!';

const getMessage = (isUpdate, isHomeBase, itemKey) =>
  isUpdate === false && isHomeBase === false
    ? 'Bitte deponieren Sie die fällige Landetaxe im Briefkasten vor dem C-Büro ' +
      'und kennzeichnen Sie den Umschlag mit der Referenznummer ' + getFromItemKey(itemKey) + '.'
    : null;

const Finish = props => {
  const heading = getHeading(props.isUpdate);
  const msg = getMessage(props.isUpdate, props.isHomeBase, props.itemKey);

  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');

  return (
    <div className="ArrivalFinish">
      <div className="heading">{heading}</div>
      {msg && <div className="msg">{msg}</div>}
      <div className="wrapper">
        <ImageButton
          label="Abflug erfassen"
          img={departureImagePath}
          onClick={props.createDepartureFromArrival.bind(null, props.itemKey)}
        />
        <ImageButton
          label="Beenden"
          img={exitImagePath}
          onClick={props.finish}
        />
      </div>
    </div>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  createDepartureFromArrival: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
};

export default Finish;
