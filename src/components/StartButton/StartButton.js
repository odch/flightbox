import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import styles from './StartButton.css';
import withStyles from '../../decorators/withStyles';
import Link from '../Link';

@withStyles(styles)
class StartButton extends Component {

  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    img: PropTypes.string,
  };

  render() {
    return (
      <div className={classNames(this.props.className, 'StartButton')}>
        <a className="StartButton-img-link" onClick={Link.handleClick}><img src={this.props.img}/></a>
        <a className="StartButton-link" onClick={Link.handleClick}>{this.props.label}</a>
      </div>
    );
  }
}

export default StartButton;
