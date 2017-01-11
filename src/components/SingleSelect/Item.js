import React from 'react';
import styled from 'styled-components';
import Button from './Button';

const LabelWrap = styled.div`
  line-height: 1em;
  ${props => props.orientation === 'vertical' && `margin-left: 1.5em;`}
`;

const Description = styled.div`
  font-size: 0.7em;
  color: #333;
`;

const Item = props => (
  <Button
    type="button"
    onClick={() => props.onClick(props.value)}
    selected={props.selected}
    widthPercentage={props.widthPercentage}
    orientation={props.orientation}
  >
    <LabelWrap orientation={props.orientation}>
      <div>{props.label}</div>
      {props.description && <Description>{props.description}</Description>}
    </LabelWrap>
  </Button>
);

Item.propTypes = {
  value: React.PropTypes.string.isRequired,
  label: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  selected: React.PropTypes.bool,
  widthPercentage: React.PropTypes.number,
  orientation: React.PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
  onClick: React.PropTypes.func.isRequired
};

export default Item;
