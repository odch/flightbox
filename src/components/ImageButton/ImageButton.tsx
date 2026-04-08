import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import OptionalLink from './OptionalLink';

const Wrapper = styled.div`
  text-align: center;
  font-size: 2em;
`;

const LinkContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const ImageButton = ({ className, label, img, href, onClick, dataCy }: any) => (
  <Wrapper className={className}>
    <OptionalLink href={href} onClick={onClick} dataCy={dataCy}>
      <LinkContent>
        <img src={img}/>
        {label}
      </LinkContent>
    </OptionalLink>
  </Wrapper>
);

ImageButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
  dataCy: PropTypes.string
};

export default ImageButton;
