import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import './ImageButton.scss';

class ImageButton extends Component {

  render() {
    return (
      <div className={classNames(this.props.className, 'ImageButton')}>
        <a className="img-link" href={this.props.href} onClick={this.clickHandler.bind(this)}><img src={this.props.img}/></a>
        <a className="text-link" href={this.props.href} onClick={this.clickHandler.bind(this)}>{this.props.label}</a>
      </div>
    );
  }

  clickHandler() {
    if (typeof this.props.onClick === 'function') {
      this.props.onClick();
    }
  }
}

ImageButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  img: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
};

export default ImageButton;
