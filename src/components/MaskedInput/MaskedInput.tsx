import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {maskEmail, maskPhone, maskText} from '../../util/masking'
import MaterialIcon from '../MaterialIcon'
import Input from '../Input'
import styled from 'styled-components'
import Tooltip from '../LabeledComponent/Tooltip'

const StyledMaskedComponent = styled.div`
  padding: 1px 2px;
  line-height: normal;
  border-bottom: 1px solid #000;
  position: relative;
`

const MaskedContent = styled.span`
  opacity: 0.5;
`

const ClearButton = styled.button`
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
`;

const MaskedInput = (props: any) => {
  const { t } = useTranslation();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const refInputDom = (input: HTMLInputElement | null) => {
    inputRef.current = input;
  };

  const handleClear = () => {
    props.input.onChange(null);
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });
  };

  if (props.input.value && !props.meta.active) {
    return (
      <StyledMaskedComponent
        data-cy={props.input.name}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
      >
        <MaskedContent>{
          props.type === 'email'
            ? maskEmail(props.input.value)
            : props.type === 'tel'
              ? maskPhone(props.input.value)
              : maskText(props.input.value)
        }</MaskedContent>
        <ClearButton onClick={handleClear} type="button">
          <MaterialIcon icon="clear"/>
        </ClearButton>
        {tooltipVisible && <Tooltip>{t('maskedInput.tooltip')}</Tooltip>}
      </StyledMaskedComponent>
    );
  }

  return (
    <Input
      {...props.input}
      name={props.name}
      type={props.type}
      readOnly={props.readOnly}
      data-cy={props.input.name}
      ref={refInputDom}
    />
  );
};

export default MaskedInput;
