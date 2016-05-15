import React, { Component } from 'react';
import './StartPage.scss';
import ImageButton from '../ImageButton';
import auth from '../../util/auth';

const LoginInfo = props => {
  const credentialsAuth = auth.getCredentialsAuth();
  if (credentialsAuth) {
    return (
      <div className="LoginInfo">
        <i className="material-icons">account_box</i>
        <span className="username">{credentialsAuth.uid}</span>
        <button className="logout" onClick={props.onLogout}>Abmelden</button>
      </div>
    );
  }

  return <div className="LoginInfo"><a href="#/login">Anmelden</a></div>;
};

LoginInfo.propTypes = {
  onLogout: React.PropTypes.func,
};

class StartPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      auth: auth.getCredentialsAuth(),
    };
  }

  render() {
    const logoImagePath = require('./mfgt_logo_transp.png');
    const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
    const movementsImagePath = require('./ic_list_black_48dp_2x.png');
    const messageImagePath = require('./ic_message_black_48dp_2x.png');
    const helpImagePath = require('./ic_help_outline_black_48dp_2x.png');
    const adminImagePath = require('./ic_settings_black_48dp_2x.png');
    return (
      <div className="StartPage">
        <header>
          <LoginInfo onLogout={this.handleLogout.bind(this)}/>
          <img className="logo" src={logoImagePath}/>
        </header>
        <div className="main">
          <div className="hint">
            <ul>
              <li>Bitte erfassen Sie Ihren <strong>Abflug immer vor dem Start</strong>.</li>
              <li>Bitte erfassen Sie Ihre <strong>Ankunft immer nach der Landung</strong>.</li>
              <li>Möchten Sie eine Ankunft für einen bereits erfassten Abflug erfassen
                (oder umgekehrt), nutzen Sie den Link <i>Ankunft erfassen</i> (bzw. <i>Abflug erfassen</i>)
                bei der bereits <a href="#/movements">erfassten Bewegung</a>.</li>
              <li>Haben Sie Fragen, Anregungen oder ein anderes Anliegen bezüglich
                der Erfassung der Abflüge und Ankünfte, benachrichtigen Sie uns
                bitte über das <a href="#/message">Rückmeldungsformular</a>.</li>
            </ul>
          </div>
          <div className="wrapper">
            <ImageButton className="departure" img={departureImagePath} label="Abflug" href="#/departure/new"/>
            <ImageButton className="arrival" img={arrivalImagePath} label="Ankunft" href="#/arrival/new"/>
            <ImageButton className="movements" img={movementsImagePath} label="Erfasste Bewegungen" href="#/movements"/>
            <ImageButton className="message" img={messageImagePath} label="Rückmeldung" href="#/message"/>
            <ImageButton className="help" img={helpImagePath} label="Hilfe" href="#/help"/>
            <ImageButton className="admin" img={adminImagePath} label="Administration" href="#/admin"/>
          </div>
        </div>
      </div>
    );
  }

  handleLogout() {
    auth.setCredentialsAuth(null);
    this.setState({
      auth: null,
    });
  }
}

export default StartPage;
