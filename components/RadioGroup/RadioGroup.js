import React, { PropTypes, Component } from 'react';
import './RadioGroup.scss';

class RadioGroup extends Component {

  static propTypes = {
    name: PropTypes.string,
    items: PropTypes.array,
  };

  render() {
    return (
      <div className="RadioGroup">
        {this.props.items.map(function(item, index) {
          return <label key={index}><input type="radio" name={this.props.name} value={item.value}/>{item.label}</label>;
        }, this)}
      </div>
    );
  }
}

export default RadioGroup;
