import PropTypes from 'prop-types';
import React from 'react';
import { getFromItemKey } from '../../../../util/reference-number';
import Wrapper from './Wrapper';
import Heading from './Heading';
import Message from './Message';
import ActionsWrapper from './ActionsWrapper';
import ActionButton from './ActionButton';

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
    <Wrapper>
      <Heading>{heading}</Heading>
      {msg && <Message>{msg}</Message>}
      <ActionsWrapper>
        <ActionButton
          label="Abflug erfassen"
          img={departureImagePath}
          onClick={props.createMovementFromMovement.bind(null, 'arrival', props.itemKey)}
        />
        <ActionButton
          label="Beenden"
          img={exitImagePath}
          onClick={props.finish}
        />
      </ActionsWrapper>
    </Wrapper>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
};

export default Finish;
