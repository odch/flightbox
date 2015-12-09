import React, { Component } from 'react';
import DeparturePage from '../components/DeparturePage';
import Location from '../core/Location';

export default class extends Component {

  render() {
    return (
      <DeparturePage finish={this.finish.bind(this)} cancel={this.cancel.bind(this)}/>
    );
  }

  finish() {
    Location.push('/');
  }

  cancel() {
    Location.push('/');
  }
}
