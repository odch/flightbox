import React, { PropTypes, Component } from 'react';

class LanguageNavigation extends Component {

  render() {
    return (
      <nav className="LanguageNavigation">
        <ul>
          <li><a href="#" hrefLang="de">Deutsch</a></li>
          <li><a href="#" hrefLang="en">English</a></li>
        </ul>
      </nav>
    );
  }
}

export default LanguageNavigation;
