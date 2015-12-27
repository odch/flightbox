import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import './ImageButton.scss';

class ImageButton extends Component {

  render() {
    return (
      <div className={classNames(this.props.className, 'ImageButton')}>
        <a className="img-link" href={this.props.href}><img src={this.props.img}/></a>
        <a className="text-link" href={this.props.href}>{this.props.label}</a>
      </div>
    );
  }
}

ImageButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  img: PropTypes.string,
  href: PropTypes.string,
};

export default ImageButton;
