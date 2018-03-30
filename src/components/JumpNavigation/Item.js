import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  display: inline-block;
  margin: 0 1.5em 0  1.5em;
  
  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }
`;

const StyledLink = styled(Link)`
  &:hover {
    color: ${props => props.theme.colors.main}
  }
`;

const Label = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const Item = props => (
  <Wrapper>
    <StyledLink to={props.href}>
      <MaterialIcon icon={props.icon}/> <Label>{props.label}</Label>
    </StyledLink>
  </Wrapper>
);

Item.propTypes = {
  href: React.PropTypes.string,
  icon: React.PropTypes.string,
  label: React.PropTypes.string
};

export default Item;
