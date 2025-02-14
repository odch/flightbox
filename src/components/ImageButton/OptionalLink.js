import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';

const StyledLink = styled(Link)`
  display: block;
  cursor: pointer;
  margin: 0 1em;
  padding: 1em;
  border-radius: 10px;

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

const ClickableChild = styled.div`
  cursor: pointer;
`;

const OptionalLink = props =>
  props.href
    ? <StyledLink to={props.href} onClick={props.onClick} data-cy={props.dataCy}>{props.children}</StyledLink>
    : <ClickableChild onClick={props.onClick} data-cy={props.dataCy}>{props.children}</ClickableChild>;

OptionalLink.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  dataCy: PropTypes.string
};

export default OptionalLink;
