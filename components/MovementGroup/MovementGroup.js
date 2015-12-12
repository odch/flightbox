import React, { PropTypes, Component } from 'react';
import Movement from '../Movement';
import './MovementGroup.scss';

class MovementGroup extends Component {

  static propTypes = {
    label: PropTypes.string,
    items: PropTypes.array,
    onClick: PropTypes.func,
  };

  render() {
    let className = 'MovementGroup';
    if (this.props.items.length === 0) {
      className += ' empty';
    }
    return (
      <div className={className}>
        <div className="label">{this.props.label}</div>
        <div className="items">
          {this.props.items.map(function(item) {
            return <Movement data={item} onClick={this.itemClick.bind(this, item)}/>;
          }, this)}
        </div>
      </div>
    );
  }

  itemClick(item) {
    this.props.onClick(item);
  }
}

export default MovementGroup;
