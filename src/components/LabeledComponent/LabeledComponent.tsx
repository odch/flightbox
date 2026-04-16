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
}

const LabeledComponent: React.FC<LabeledComponentProps> = ({
  label,
  component,
  className,
  validationError,
  tooltip,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <Wrapper className={className} onFocus={() => setTooltipVisible(true)} onBlur={() => setTooltipVisible(false)}>
      <Label>{label}</Label>
      {validationError && <ValidationMessage error={validationError}/>}
      <ComponentContainer>{component}</ComponentContainer>
      {tooltipVisible && tooltip && <Tooltip>{tooltip}</Tooltip>}
    </Wrapper>
  );
};

export default LabeledComponent;
