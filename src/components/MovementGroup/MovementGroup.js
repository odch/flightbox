import React, { PropTypes, Component } from 'react';
import Movement from '../Movement';
import './MovementGroup.scss';
import { isLocked } from '../../util/movements.js';

class MovementGroup extends Component {

  render() {
    let className = 'MovementGroup';
    if (this.props.items.length === 0) {
      className += ' empty';
    }
    return (
      <div className={className}>
        <div className="label">{this.props.label}</div>
        <div className="items">
          {this.props.items.map((item, index) => {
            return (
              <Movement
                key={index}
                data={item}
                onClick={this.itemClick.bind(this, item)}
                timeWithDate={this.props.timeWithDate}
                onAction={this.props.onAction}
                actionLabel={this.props.actionLabel}
                onDelete={this.props.onDelete}
                locked={isLocked(item, this.props.lockDate)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  itemClick(item) {
    this.props.onClick(item);
  }
}

MovementGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.array,
  onClick: PropTypes.func,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func,
  actionLabel: PropTypes.element,
  onDelete: PropTypes.func,
  lockDate: PropTypes.number,
};

export default MovementGroup;
