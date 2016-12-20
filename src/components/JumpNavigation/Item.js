import React from 'react';
import styled from 'styled-components';

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

const A = styled.a`
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
    <A href={props.href}>
      <i className="material-icons">{props.icon}</i> <Label>{props.label}</Label>
    </A>
  </Wrapper>
);

Item.propTypes = {
  href: React.PropTypes.string,
  icon: React.PropTypes.string,
  label: React.PropTypes.string
};

export default Item;
