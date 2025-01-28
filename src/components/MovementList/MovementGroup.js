import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Movement from './Movement';
import {isLocked} from '../../util/movements.js';

const GroupWrapper = styled.div`
  margin: 0 0 2em 0;
  box-shadow: 3px;
`;

const GroupLabel = styled.div`
  padding: 1em;
`;

const ItemsContainer = styled.div`
`;

class MovementGroup extends React.PureComponent {

  render() {
    const props = this.props;
    const filteredItems = props.items.array.filter(props.predicate);

    if (filteredItems.length === 0) {
      return null;
    }

    return (
      <GroupWrapper>
        <GroupLabel>{props.label}</GroupLabel>
        <ItemsContainer>
          {filteredItems.map(item =>
            <Movement
              key={item.key}
              data={item}
              selected={item.key === props.selected}
              onSelect={props.onSelect}
              onEdit={props.onEdit}
              timeWithDate={props.timeWithDate}
              createMovementFromMovement={props.createMovementFromMovement}
              onDelete={props.onDelete}
              locked={isLocked(item, props.lockDate)}
              aircraftSettings={props.aircraftSettings}
              loading={props.loading}
              isAdmin={props.isAdmin}
            />
          )}
        </ItemsContainer>
      </GroupWrapper>
    );
  }
}

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
