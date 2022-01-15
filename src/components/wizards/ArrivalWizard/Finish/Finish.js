import PropTypes from 'prop-types';
import React from 'react';
import { getFromItemKey } from '../../../../util/reference-number';
import formatMoney from '../../../../util/formatMoney';
import Wrapper from './Wrapper';
import Heading from './Heading';
import Message, {ReferenceNumberMessage} from './Message';
import ActionsWrapper from './ActionsWrapper';
import ActionButton from './ActionButton';

const getHeading = isUpdate =>
  isUpdate === true
    ? 'Die Ankunft wurde erfolgreich aktualisiert!'
    : 'Ihre Ankunft wurde erfolgreich erfasst!';

const getLandingFeeMsg = (isHomeBase, landings, landingFeeSingle, landingFeeTotal) =>
  isHomeBase === false && landingFeeTotal !== undefined
    ? `Landetaxe: CHF ${formatMoney(landingFeeTotal)} ${landings > 1 ? `(${landings} mal CHF ${formatMoney(landingFeeSingle)})` : ''}`
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
  const landingFeeMsg = getLandingFeeMsg(isHomeBase, landings, landingFeeSingle, landingFeeTotal);

  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');

  return (
    <Wrapper>
      <Heading>{heading}</Heading>
      {landingFeeMsg && (
        <>
          <ReferenceNumberMessage>Referenznummer: {getFromItemKey(itemKey)}</ReferenceNumberMessage>
          <Message>{landingFeeMsg}</Message>
        </>
      )}
      {isHomeBase === false && <Message>
        Bitte deponieren Sie die fällige Landetaxe im Briefkasten vor dem C-Büro und kennzeichnen Sie den Umschlag
        mit der Referenznummer {getFromItemKey(itemKey)}.
      </Message>}
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
