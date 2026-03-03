import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { withTranslation } from 'react-i18next';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  clear: both;
`;

const IconWrapper = styled.span<{ $withText?: boolean }>`
  ${props => props.$withText && `float: left`}
`;

const StyledIcon = styled(MaterialIcon)<{ $isHomeBase?: boolean }>`
  color: #ccc;
  position: relative;

  ${props => !props.$isHomeBase && `
    &:before {
      position: absolute;
      content: "";
      left: 0;
      top: 40%;
      right: 0;
      transform:rotate(45deg);
      border-top: 2px solid;
      border-top-color: white;
      border-bottom: 2px solid;
      border-bottom-color: inherit;
    }
  `}
`;

const Text = styled.div`
  margin-left: 30px;
  line-height: 24px;
`;

class HomeBaseIcon extends React.PureComponent<any, any> {

  render() {
    const { t } = this.props;
    const text = t(
      this.props.isHomeBase ? 'movement.homeBase.yes' : 'movement.homeBase.no',
      { name: __CONF__.aerodrome.name }
    );

    return (
      <Wrapper className={this.props.className}>
        <IconWrapper $withText={this.props.showText}>
          <StyledIcon
            icon="home"
            title={text}
            $isHomeBase={this.props.isHomeBase}
          />
        </IconWrapper>
        {this.props.showText && <Text>{text}</Text>}
      </Wrapper>
    );
  }
}

(HomeBaseIcon as any).propTypes = {
  className: PropTypes.string,
  isHomeBase: PropTypes.bool.isRequired,
  showText: PropTypes.bool
};

export default withTranslation()(HomeBaseIcon);
