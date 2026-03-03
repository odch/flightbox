import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.fieldset<{ $gutter?: boolean }>`
  border: 0;
  ${props => props.$gutter && `margin: 1em;`}
`;

const Legend = styled.legend`
  font-size: 2em;
  margin-bottom: 1em;
`;

class FieldSet extends React.PureComponent<any, any> {

  render() {
    const props = this.props;
    return (
      <Wrapper $gutter={props.gutter}>
        {props.legend && <Legend>{props.legend}</Legend>}
        {props.children}
      </Wrapper>
    );
  }
}

const FieldSetAny = FieldSet as any;
FieldSetAny.defaultProps = {
  gutter: true
};

FieldSetAny.propTypes = {
  legend: PropTypes.string,
  gutter: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default FieldSet;
