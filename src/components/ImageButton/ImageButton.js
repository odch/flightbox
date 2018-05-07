import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import OptionalLink from './OptionalLink';

const Wrapper = styled.div`
  text-align: center;
  font-size: 2em;
`;

class ImageButton extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper className={props.className}>
        <OptionalLink href={props.href} onClick={props.onClick}><img src={props.img}/></OptionalLink>
        <OptionalLink href={props.href} onClick={props.onClick}>{props.label}</OptionalLink>
      </Wrapper>
    )
  }
}

ImageButton.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
};

export default ImageButton;
