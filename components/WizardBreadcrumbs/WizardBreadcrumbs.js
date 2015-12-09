import React, { PropTypes, Component } from 'react';
import './WizardBreadcrumbs.scss';

class WizardBreadcrumbs extends Component {

  static propTypes = {
    items: PropTypes.array,
    activeItem: PropTypes.number,
  };

  render() {
    return (
      <nav className="WizardBreadcrumbs">
        <ol>
          {this.props.items.map(function(item, index) {
            let className = item.className;
            if (index === this.props.activeItem) {
              className += ' active';
            }
            if (!item.handler) {
              className += ' no-handler';
            }
            return <li className={className} key={index}><a onClick={item.handler}>{item.label}</a></li>;
          }, this)}
        </ol>
      </nav>
    );
  }
}

export default WizardBreadcrumbs;
