import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';

const Wrapper = styled.div`
  padding: 1em;
  border-bottom: 1px solid #ddd;
`;

const Label = styled.label`
  cursor: pointer;
`;

const Input = styled.input`
  margin-right: 1em;
  cursor: pointer;
`;

const AerodromeStatusBannerToggle = (props: any) => {
  const {t} = useTranslation();
  const {enabled, disabled, setAerodromeStatusBannerEnabled} = props;

  return (
    <Wrapper>
      <Label>
        <Input
          type="checkbox"
          checked={enabled === true}
          disabled={disabled}
          onChange={e => setAerodromeStatusBannerEnabled(e.target.checked)}
        />
        {t('aerodromeStatus.showOnStartPage')}
      </Label>
    </Wrapper>
  );
};

(AerodromeStatusBannerToggle as any).propTypes = {
  enabled: PropTypes.bool,
  disabled: PropTypes.bool,
  setAerodromeStatusBannerEnabled: PropTypes.func.isRequired,
};

export default AerodromeStatusBannerToggle;
