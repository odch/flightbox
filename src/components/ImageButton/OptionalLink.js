import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';

const StyledLink = styled(Link)`
  display: block;
  cursor: pointer;
`;

const ClickableChild = styled.div`
  cursor: pointer;
`;

const OptionalLink = props =>
  props.href
    ? <StyledLink to={props.href} onClick={props.onClick}>{props.children}</StyledLink>
    : <ClickableChild onClick={props.onClick}>{props.children}</ClickableChild>;

OptionalLink.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

export default OptionalLink;
