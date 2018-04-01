import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-bottom: 2em;
`;

const Input = styled.input`
  margin-right: 1em;
`;

const InternalReportCheckbox = props => (
  <Wrapper>
    <label>
      <Input
        type="checkbox"
        checked={props.internal}
        onChange={e => props.setInternal(e.target.checked)}
      />
      Zusätzliche Informationen inkludieren (nur für internen Gebrauch)
    </label>
  </Wrapper>
);

InternalReportCheckbox.propTypes = {
  internal: PropTypes.bool.isRequired,
  setInternal: PropTypes.func.isRequired
};

export default InternalReportCheckbox;
