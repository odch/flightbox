import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
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

const HomeBaseIcon = ({ className, isHomeBase, showText }: any) => {
  const { t } = useTranslation();
  const text = t(
    isHomeBase ? 'movement.homeBase.yes' : 'movement.homeBase.no',
    { name: __CONF__.aerodrome.name }
  );

  return (
    <Wrapper className={className}>
      <IconWrapper $withText={showText}>
        <StyledIcon
          icon="home"
          title={text}
          $isHomeBase={isHomeBase}
        />
      </IconWrapper>
      {showText && <Text>{text}</Text>}
    </Wrapper>
  );
};

HomeBaseIcon.propTypes = {
  className: PropTypes.string,
  isHomeBase: PropTypes.bool.isRequired,
  showText: PropTypes.bool
};

export default HomeBaseIcon;
