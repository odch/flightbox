import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Button from './Button';

const LabelWrap = styled.div<{ $orientation?: string; $alignStart?: boolean }>`
  line-height: 1em;
  ${props => props.$alignStart
    ? `
      /* The column of the texts, next to the one of the tick */
      flex: 1;
      min-width: 0;
    `
    : props.$orientation === 'vertical' && `margin-left: 1.5em;`}
`;

const Description = styled.div`
  font-size: 0.7em;
  color: #333;
  margin-top: 0.25em;
  text-wrap: pretty;
`;

const Item = props => (
  <Button
    type="button"
    onClick={() => props.onClick(props.value)}
    $selected={props.selected}
    $widthPercentage={props.widthPercentage}
    $orientation={props.orientation}
    $alignStart={props.alignStart}
    data-cy={props.dataCy}
  >
    <LabelWrap $orientation={props.orientation} $alignStart={props.alignStart}>
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
  // The tick in a column of its own and the texts at the start, for the
  // items of a select with descriptions
  alignStart: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  dataCy: PropTypes.string
};

export default Item;
