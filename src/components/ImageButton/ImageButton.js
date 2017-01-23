import React, {PropTypes} from 'react';
import styled from 'styled-components';

const handleClick = onClick => {
  if (typeof onClick === 'function') {
    onClick();
  }
};

const Wrapper = styled.div`
  text-align: center;
  font-size: 2em;
`;

const Link = styled.a`
  display: block;
  cursor: pointer;
`;

const ImageButton = props => (
  <Wrapper className={props.className}>
    <Link href={props.href} onClick={handleClick.bind(null, props.onClick)}><img src={props.img}/></Link>
    <Link href={props.href} onClick={handleClick.bind(null, props.onClick)}>{props.label}</Link>
  </Wrapper>
);

ImageButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
};

export default ImageButton;
