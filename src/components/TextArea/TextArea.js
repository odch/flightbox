import React from 'react';
import classNames from 'classnames';
import './TextArea.scss';

const TextArea = props => <textarea {...props} className={classNames('TextArea', props.className)}/>;

export default TextArea;
