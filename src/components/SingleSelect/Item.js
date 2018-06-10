import PropTypes from 'prop-types';
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
    data-cy={props.dataCy}
  >
    <LabelWrap orientation={props.orientation}>
      <div>{props.label}</div>
      {props.description && <Description>{props.description}</Description>}
    </LabelWrap>
  </Button>
);

Item.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  selected: PropTypes.bool,
  widthPercentage: PropTypes.number,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
  onClick: PropTypes.func.isRequired,
  dataCy: PropTypes.string
};

export default Item;
