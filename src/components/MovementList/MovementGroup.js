import React, { PropTypes, Component } from 'react';
import styled from 'styled-components';
import Movement from './Movement';
import { isLocked } from '../../util/movements.js';

const GroupWrapper = styled.div`
  margin: 0 0 2em 0;
  overflow: hidden;
  border: 1px solid #eee;
  box-shadow: 3px;
`;

const GroupLabel = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.main};
  padding: 1em;
  background-color: ${props => props.theme.colors.background};
`;

const ItemsContainer = styled.div`
  overflow: hidden;
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
                data={item}
                onClick={props.onClick}
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
  label: PropTypes.string,
  items: PropTypes.array,
  predicate: PropTypes.func,
  onClick: PropTypes.func,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func,
  actionIcon: PropTypes.string,
  actionLabel: PropTypes.string,
  onDelete: PropTypes.func,
  lockDate: PropTypes.number,
};

export default MovementGroup;
