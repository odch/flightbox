import PropTypes from 'prop-types';
import React from 'react';
import MaterialIcon from '../MaterialIcon';
import styled from 'styled-components';

const StyledAction = styled.span<{ $disabled?: boolean }>`
  ${props => props.$disabled
    ? `
      color: #ddd;
    `
    : `
      cursor: pointer;

      &:hover {
        color: ${props.theme.colors.main};
      }
    `
  }
`;

const ActionLabel = styled.span<{ $responsive?: boolean }>`
  ${props => props.$responsive && `
    @media (max-width: 1200px) {
      display: none;
    }`
  }
`;

const Action = ({ className, onClick, icon, label, disabled, responsive, rotateIcon, dataCy }: any) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled) {
      onClick();
    }
  };

  return (
    <StyledAction onClick={handleClick} className={className} $disabled={disabled} data-cy={dataCy}>
      <MaterialIcon icon={icon} rotate={rotateIcon}/>
      <ActionLabel $responsive={responsive}>&nbsp;{label}</ActionLabel>
    </StyledAction>
  );
};

Action.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  responsive: PropTypes.bool,
  rotateIcon: PropTypes.oneOf(['left', 'right']),
  dataCy: PropTypes.string,
};

export default Action;
