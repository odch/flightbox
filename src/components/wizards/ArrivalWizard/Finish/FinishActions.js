import React from 'react'
import PropTypes from 'prop-types'
import ActionButton from './ActionButton'
import ActionsWrapper from './ActionsWrapper'

const FinishActions = ({itemKey, createMovementFromMovement, finish}) => {
  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');

  return (
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
  )
}

FinishActions.propTypes = {
  itemKey: PropTypes.string.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired
}

export default FinishActions
