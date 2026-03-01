import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  margin-bottom: 2em;
`;

const Input = styled.input`
  margin-right: 1em;
`;

const InternalReportCheckbox = props => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <label>
        <Input
          type="checkbox"
          checked={props.internal}
          onChange={e => props.setInternal(e.target.checked)}
        />
        {t('airstatReport.includeInternal')}
      </label>
    </Wrapper>
  );
};

InternalReportCheckbox.propTypes = {
  internal: PropTypes.bool.isRequired,
  setInternal: PropTypes.func.isRequired
};

export default InternalReportCheckbox;
