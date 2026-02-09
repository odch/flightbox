import React from 'react';
import {withTheme} from 'styled-components';

const Logo = ({ theme, ...rest }) => <img {...rest} src={theme.images.logo}/>;

export default withTheme(Logo);
