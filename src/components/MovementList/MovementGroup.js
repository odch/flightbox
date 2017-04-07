import React, { PropTypes, Component } from 'react';
import styled from 'styled-components';
import Movement from './Movement';
import { isLocked } from '../../util/movements.js';

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
    const items = props.items.filter(props.predicate);

    if (items.length === 0) {
      return null;
    }

    return (
      <GroupWrapper>
        <GroupLabel>{props.label}</GroupLabel>
        <ItemsContainer>
          {items.map(item => {
            return (
              <Movement
                key={item.key}
                movementType={props.movementType}
                data={item}
                selected={item.key === props.selected}
                onSelect={props.onSelect}
                onEdit={props.onEdit}
                timeWithDate={props.timeWithDate}
                onAction={props.onAction}
                actionIcon={props.actionIcon}
                actionLabel={props.actionLabel}
                onDelete={props.onDelete}
                locked={isLocked(item, props.lockDate)}
              />
            );
          })}
        </ItemsContainer>
      </GroupWrapper>
    );
  }
}

MovementGroup.propTypes = {
  movementType: PropTypes.oneOf(['departure', 'arrival']),
  label: PropTypes.string,
  items: PropTypes.array,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  predicate: PropTypes.func,
  onEdit: PropTypes.func,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func,
  actionIcon: PropTypes.string,
  actionLabel: PropTypes.string,
  onDelete: PropTypes.func,
  lockDate: PropTypes.number,
};

export default MovementGroup;
