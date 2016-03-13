import React, { Component } from 'react';
import './MessagePage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import MessageForm from '../MessageForm';

class MessagePage extends Component {

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    return (
      <BorderLayout className="MessagePage">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          <MessageForm/>
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

export default MessagePage;
