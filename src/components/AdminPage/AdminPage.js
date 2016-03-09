import React, { Component } from 'react';
import './AdminPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import ReportForm from '../ReportForm';

class MovementsPage extends Component {

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    return (
      <BorderLayout className="MovementsPage">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          <ReportForm/>
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

export default MovementsPage;
