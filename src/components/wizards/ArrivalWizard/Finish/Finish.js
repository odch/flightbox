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

const formatMoney = value => parseFloat(Math.round(value * 100) / 100).toFixed(2);

const getLandingFeeMsg = (isUpdate, isHomeBase, landings, landingFeeSingle, landingFeeTotal) =>
  isUpdate === false && isHomeBase === false && landingFeeTotal !== undefined
    ? `Landetaxe: CHF ${formatMoney(landingFeeTotal)} ${landings > 1 ? `(${landings} mal CHF ${formatMoney(landingFeeSingle)})` : ''}`
    : null;

const getMessage = (isUpdate, isHomeBase, itemKey) =>
  isUpdate === false && isHomeBase === false
    ? 'Bitte deponieren Sie die fällige Landetaxe im Briefkasten vor dem C-Büro ' +
      'und kennzeichnen Sie den Umschlag mit der Referenznummer ' + getFromItemKey(itemKey) + '.'
    : null;

const Finish = props => {
  const {
    isUpdate,
    isHomeBase,
    itemKey,
    landings,
    landingFeeSingle,
    landingFeeTotal,
    createMovementFromMovement,
    finish
  } = props

  const heading = getHeading(isUpdate);
  const landingFeeMsg = getLandingFeeMsg(isUpdate, isHomeBase, landings, landingFeeSingle, landingFeeTotal);
  const msg = getMessage(isUpdate, isHomeBase, itemKey);

  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');

  return (
    <Wrapper>
      <Heading>{heading}</Heading>
      {landingFeeMsg && <Message>{landingFeeMsg}</Message>}
      {msg && <Message>{msg}</Message>}
      <ActionsWrapper>
        <ActionButton
          label="Abflug erfassen"
          img={departureImagePath}
          onClick={createMovementFromMovement.bind(null, 'arrival', itemKey)}
        />
        <ActionButton
          label="Beenden"
          img={exitImagePath}
          onClick={finish}
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
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeTotal: PropTypes.number,
};

export default Finish;
