import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';

const StyledLink = styled(Link)`
  display: block;
  cursor: pointer;
  margin: 0 1em;
  padding: 1em;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;
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
