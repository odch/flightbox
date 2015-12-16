import React, { PropTypes, Component } from 'react';
import './VerticalHeaderPage.scss';
import LanguageNavigation from '../LanguageNavigation';

class VerticalHeaderPage extends Component {

  render() {
    const className = 'VerticalHeaderPage ' + this.props.className;
    const logoImagePath = require('./mfgt_logo_transp.png');
    return (
      <div className={className}>
        <header>
          <img className="logo" src={logoImagePath}/>
          <LanguageNavigation/>
        </header>
        <div className="right">
          {this.props.component}
        </div>
      </div>
    );
  }
}

VerticalHeaderPage.propTypes = {
  className: PropTypes.string,
  component: PropTypes.element,
};

export default VerticalHeaderPage;
