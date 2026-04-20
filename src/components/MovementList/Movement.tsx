import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import dates from '../../util/dates';
import MovementHeader from './MovementHeader';
import MovementDetails from './MovementDetails';
import AssociatedMovement from '../../containers/AssociatedMovementContainer';
import Action from './Action';

const Wrapper = styled.div<{ $selected?: boolean }>`
  background-color: #fbfbfb;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.24);

  ${props => props.$selected && `
    margin: 20px -10px 20px -10px;

    @media (max-width: 768px) {
      margin: 10px -3px 10px -3px;
    }
  `}
`;

const StyledMovementDetails = styled(MovementDetails)`
  background-color: #fff;
`;

const Footer = styled.div`
  background-color: #fff;
  text-align: right;
  padding-right: 0.7em;
  padding-bottom: 0.7em;
  font-size: 1.3em;
  display: flex;
  gap: 25px;
  justify-content: end;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
`;

const Movement = React.memo((props: any) => {
  const { t } = useTranslation();
  const { timeWithDate = true } = props;

  const handleClick = () => {
    const selected = props.selected ? null : props.data.key;
    props.onSelect(selected);
  };

  const handleDeleteClick = () => {
    props.onDelete(props.data);
  };

  const handleEditClick = () => {
    props.onEdit(props.data.type, props.data.key);
  };

  const handleCustomsClick = () => {
    props.onStartCustoms(props.data);
  };

  const isForeignFlight = () => {
    const { data, aerodromes } = props;
    if (!aerodromes || !aerodromes.data) {
      return false;
    }
    const aerodrome = aerodromes.data.getByKey(data.location);
    if (!aerodrome) {
      return false;
    }
    return aerodrome.country !== 'CH';
  };

  const isFutureFlightTime = () => {
    const { data } = props;
    const flightTimestamp = dates.localToIsoUtc(data.date, data.time);
    const now = new Date().toISOString();
    return flightTimestamp > now;
  };

  const shouldShowCustomsAction = () => {
    const { data, customs } = props;
    if (customs && customs.available !== true) {
      return false;
    }
    if (data.customsFormId) {
      return true;
    }
    return isForeignFlight() && isFutureFlightTime();
  };

  const isHomeBase = props.aircraftSettings.club[props.data.immatriculation] === true
    || props.aircraftSettings.homeBase[props.data.immatriculation] === true;

  return (
    <Wrapper $selected={props.selected} data-id={props.data.key}>
      <MovementHeader
        onClick={handleClick}
        selected={props.selected}
        data={props.data}
        timeWithDate={timeWithDate}
        createMovementFromMovement={props.createMovementFromMovement}
        locked={props.locked}
        isHomeBase={isHomeBase}
        isAdmin={props.isAdmin}
      />
      {props.selected && (
        <div>
          <StyledMovementDetails
            data={props.data}
            locked={props.locked}
            isHomeBase={isHomeBase}
            isAdmin={props.isAdmin}
          />
          {!props.locked && (
            <Footer>
              {shouldShowCustomsAction() && (
                <Action
                  label={props.data.customsFormId ? t('movement.openCustoms') : t('movement.recordCustoms')}
                  icon={props.customs.loading ? "sync" : "description"}
                  rotateIcon={props.customs.loading ? 'left' : undefined}
                  disabled={props.customs.loading}
                  onClick={handleCustomsClick}
                />
              )}
              <Action
                label={t('movement.edit')}
                icon="edit"
                onClick={handleEditClick}
                dataCy="action-edit"
              />
              <Action
                label={t('movement.delete')}
                icon="delete"
                onClick={handleDeleteClick}
                dataCy="action-delete"
              />
            </Footer>
          )}
          <AssociatedMovement
            movementType={props.data.type}
            movementKey={props.data.key}
            isHomeBase={isHomeBase}
            associatedMovement={props.data.associatedMovement}
            createMovementFromMovement={props.createMovementFromMovement}
            loading={props.loading}
            isAdmin={props.isAdmin}
          />
        </div>
      )}
    </Wrapper>
  );
});

(Movement as any).displayName = 'Movement';

(Movement as any).propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  customs: PropTypes.shape({
    loading: PropTypes.bool,
    success: PropTypes.bool
  }).isRequired,
  aerodromes: PropTypes.shape({
    data: PropTypes.object
  }),
  onEdit: PropTypes.func.isRequired,
  onStartCustoms: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  timeWithDate: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  loading: PropTypes.bool.isRequired
};

export default Movement;
