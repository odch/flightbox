import React, { PropTypes, Component } from 'react';
import './JumpNavigation.scss';

class JumpNavigation extends Component {

  render() {
    return (
      <div className="JumpNavigation">
        <div className="home">
          <a href="#/">
            <i className="material-icons">home</i> <span className="label">Startseite</span>
          </a>
        </div>
        <div className="departure">
          <a href="#/departure/new">
            <i className="material-icons">flight_takeoff</i> <span className="label">Abflug erfassen</span>
          </a>
        </div>
        <div className="arrival">
          <a href="#/arrival/new">
            <i className="material-icons">flight_land</i> <span className="label">Ankunft erfassen</span>
          </a>
        </div>
      </div>
    );
  }
}

export default JumpNavigation;
