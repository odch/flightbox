import React from 'react';
import classNames from 'classnames';
import './Input.scss';

const Input = props => <input {...props} className={classNames('Input', props.className)}/>;

export default Input;
