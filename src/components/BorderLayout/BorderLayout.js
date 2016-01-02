import React, { PropTypes, Component, Children } from 'react';
import './BorderLayout.scss';

class BorderLayout extends Component {

  render() {
    let className = 'BorderLayout';
    if (this.props.className) {
      className += ' ' + this.props.className;
    }

    const arr = Children.toArray(this.props.children);
    const west = arr.find(child => child.props.region === 'west');
    const east = arr.find(child => child.props.region === 'east');
    const north = arr.find(child => child.props.region === 'north');
    const south = arr.find(child => child.props.region === 'south');
    const middle = arr.find(child => child.props.region === 'middle');

    if (west) {
      className += ' west-visible';
    }
    if (east) {
      className += ' east-visible';
    }
    if (north) {
      className += ' north-visible';
    }
    if (south) {
      className += ' south-visible';
    }
    if (middle) {
      className += ' middle-visible';
    }

    return (
      <div className={className} onFocus={this.props.onFocus} onBlur={this.props.onBlur}>
        <div className="west">{west}</div>
        <div className="center">
          <div className="north">{north}</div>
          <div className="middle">{middle}</div>
          <div className="south">{south}</div>
        </div>
        <div className="east">{east}</div>
      </div>
    );
  }
}

BorderLayout.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

export default BorderLayout;
