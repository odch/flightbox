import React, { useState } from 'react';
import Label from './Label';
import ComponentContainer from './ComponentContainer';
import Tooltip from './Tooltip';
import ValidationMessage from './ValidationMessage';
import Wrapper from './Wrapper';

interface LabeledComponentProps {
  label: string;
  component: React.ReactElement;
  className?: string;
  validationError?: string | null;
  tooltip?: string;
  // Rendered inside the field wrapper, below the input but outside the input's
  // ComponentContainer, so it shares the field width without inheriting the input
  // sizing (e.g. quick-pick chips under a dropdown).
  footer?: React.ReactNode;
}

const LabeledComponent: React.FC<LabeledComponentProps> = ({
  label,
  component,
  className,
  validationError,
  tooltip,
  footer,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <Wrapper className={className} onFocus={() => setTooltipVisible(true)} onBlur={() => setTooltipVisible(false)}>
      <Label>{label}</Label>
      {validationError && <ValidationMessage error={validationError}/>}
      <ComponentContainer>{component}</ComponentContainer>
      {footer}
      {tooltipVisible && tooltip && <Tooltip>{tooltip}</Tooltip>}
    </Wrapper>
  );
};

export default LabeledComponent;
