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

class ImageButton extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper className={props.className}>
        <OptionalLink href={props.href} onClick={props.onClick} dataCy={props.dataCy}>
          <LinkContent>
            <img src={props.img}/>
            {props.label}
          </LinkContent>
        </OptionalLink>
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
  dataCy: PropTypes.string
};

export default ImageButton;
