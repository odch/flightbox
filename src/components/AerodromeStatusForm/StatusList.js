import PropTypes from 'prop-types';
import React, {Component} from 'react';
import StatusShape from './StatusShape';
import Status from './Status';
import StatusHeader from './StatusHeader';
import StatusContent from './StatusContent';

class StatusList extends Component {

  handleStatusClick(key) {
    this.props.selectStatus(this.props.selected === key ? null : key);
  }

  render() {
    const {items, selected} = this.props;
    return (
      <div>
        {items.array.map((item, index) => {
          const active = index === 0
          const isSelected = active || selected === item.key;
          return (
            <Status
              key={index}
              $selected={isSelected}
            >
              <StatusHeader
                item={item}
                selected={isSelected}
                active={active}
                onClick={this.handleStatusClick.bind(this, item.key)}
              />
              {isSelected && <StatusContent item={item}/>}
            </Status>
          );
        })}
      </div>
    );
  }
}

StatusList.propTypes = {
  items: PropTypes.shape({
    array: PropTypes.arrayOf(StatusShape).isRequired,
  }).isRequired,
  selected: PropTypes.string,
  selectStatus: PropTypes.func.isRequired
};

export default StatusList;
