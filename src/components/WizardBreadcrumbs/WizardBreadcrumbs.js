import React, { PropTypes, Component } from 'react';
import './WizardBreadcrumbs.scss';

class WizardBreadcrumbs extends Component {

  render() {
    return (
      <nav className="WizardBreadcrumbs">
        <ol>
          {this.props.items.map((item, index) => {
            let className = item.className;
            if (index === this.props.activeItem) {
              className += ' active';
            }
            const previousValid = this.arePreviousItemsValid(index);
            const handler = previousValid ? item.handler : undefined;
            if (!handler) {
              className += ' no-handler';
            }
            return (
              <li className={className} key={index}>
                <a onMouseDown={handler} tabIndex="-1">{item.label}</a>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  arePreviousItemsValid(index) {
    for (let i = 0; i < index; i++) {
      if (this.props.items[i].valid === false) {
        return false;
      }
    }
    return true;
  }
}

WizardBreadcrumbs.propTypes = {
  items: PropTypes.array.isRequired,
  activeItem: PropTypes.number,
};

export default WizardBreadcrumbs;
