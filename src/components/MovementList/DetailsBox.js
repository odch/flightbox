import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 33.3%;
  box-sizing: border-box;
  padding-bottom: 1.5em;
  
  @media (max-width: 1200px) {
    width: 50%;
  }
  
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const Label = styled.div`
  font-size: 1.2em;
  margin-bottom: 1em;
  color: ${props => props.theme.colors.main}
`;

class DetailsBox extends React.PureComponent {

  render() {
    const {label, children} = this.props;
    return (
      <Wrapper>
        {label && <Label>{label}</Label>}
        {children}
      </Wrapper>
    )
  }
}

DetailsBox.propTypes = {
  label: PropTypes.string
};

export default DetailsBox;
