import React, { PropTypes, Component } from 'react';
import Movement from '../Movement';
import './MovementGroup.scss';

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
          {this.props.items.map(function(item, index) {
            return <Movement key={index} data={item} onClick={this.itemClick.bind(this, item)}/>;
          }, this)}
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
};

export default MovementGroup;
