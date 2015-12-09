import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import './ImageButton.scss';
import Link from '../Link';

class ImageButton extends Component {

  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    img: PropTypes.string,
    href: PropTypes.string,
  };

  render() {
    return (
      <div className={classNames(this.props.className, 'ImageButton')}>
        <a className="img-link" onClick={Link.handleClick} href={this.props.href}><img src={this.props.img}/></a>
        <a className="text-link" onClick={Link.handleClick} href={this.props.href}>{this.props.label}</a>
      </div>
    );
  }
}

export default ImageButton;
