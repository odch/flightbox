import React, {PropTypes} from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';

const Wrapper = styled.div`
  text-align: center;
  font-size: 2em;
`;

const StyledLink = styled(Link)`
  display: block;
  cursor: pointer;
`;

const ClickableChild = styled.div`
  cursor: pointer;
`;

const OptionalLink = props =>
  props.href
    ? <StyledLink to={props.href} onClick={props.onClick}>{props.children}</StyledLink>
    : <ClickableChild onClick={props.onClick}>{props.children}</ClickableChild>;

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
