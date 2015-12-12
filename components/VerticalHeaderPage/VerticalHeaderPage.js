import React, { PropTypes, Component } from 'react';
import './VerticalHeaderPage.scss';
import LanguageNavigation from '../LanguageNavigation';

class VerticalHeaderPage extends Component {

  static propTypes = {
    className: PropTypes.string,
    component: PropTypes.element,
  };

  render() {
    const className = 'VerticalHeaderPage ' + this.props.className;
    return (
      <div className={className}>
        <header>
          <img className="logo" src="mfgt_logo_transp.png"/>
          <LanguageNavigation/>
        </header>
        <div className="right">
          {this.props.component}
        </div>
      </div>
    );
  }
}

export default VerticalHeaderPage;
