import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Movement from '../../containers/MovementListMovementContainer';
import {isLocked} from '../../util/movements';

const GroupWrapper = styled.div`
  margin: 0 0 2em 0;
  box-shadow: 3px;
`;

const GroupLabel = styled.div`
  padding: 1em;
`;

const ItemsContainer = styled.div`
`;

const MovementGroup = ({
  label, items, selected, onSelect, onEdit, timeWithDate,
  createMovementFromMovement, onDelete, lockDate, aircraftSettings,
  loading, isAdmin, predicate
}: any) => {
  const filteredItems = items.array.filter(predicate);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <GroupWrapper>
      <GroupLabel>{label}</GroupLabel>
      <ItemsContainer>
        {filteredItems.map(item =>
          <Movement
            key={item.key}
            data={item}
            selected={item.key === selected}
            onSelect={onSelect}
            onEdit={onEdit}
            timeWithDate={timeWithDate}
            createMovementFromMovement={createMovementFromMovement}
            onDelete={onDelete}
            locked={isLocked(item, lockDate) || item.anonymized === true}
            aircraftSettings={aircraftSettings}
            loading={loading}
            isAdmin={isAdmin}
          />
        )}
      </ItemsContainer>
    </GroupWrapper>
  );
};

MovementGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  predicate: PropTypes.func,
  onEdit: PropTypes.func,
  timeWithDate: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  lockDate: PropTypes.number,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default MovementGroup;
