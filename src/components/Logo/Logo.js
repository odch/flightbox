import React from 'react';
import { withTheme } from 'styled-components';

const Logo = ({ theme, innerRef, ...rest }) => <img {...rest} ref={innerRef} src={theme.images.logo}/>;

export default withTheme(Logo);
