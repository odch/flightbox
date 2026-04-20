import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-left: 120px;

  @media screen and (max-width: 768px) {
    margin-left: 0;
  }
`;

const Content = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>{children}</Wrapper>
);

(Content as any).propTypes = {
  children: PropTypes.element.isRequired
};

export default Content;
