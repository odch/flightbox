import React, { useState } from 'react';
import MaterialIcon from '../MaterialIcon';
import StyledButton from './StyledButton';
import Overlay from './Overlay';
import Label from './Label';

interface ButtonProps {
  type?: 'submit' | 'button' | 'reset';
  label: string;
  icon?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  primary?: boolean;
  flat?: boolean;
  danger?: boolean;
  neutral?: boolean;
  loading?: boolean;
  dataCy?: string;
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  label,
  icon,
  className,
  disabled,
  onClick,
  primary,
  flat,
  danger,
  neutral,
  loading,
  dataCy,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <StyledButton
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      $primary={primary}
      $flat={flat}
      $danger={danger}
      $neutral={neutral}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-cy={dataCy}
    >
      <Overlay
        disabled={disabled}
        $hovered={hovered}
        $danger={danger}
        $flat={flat}
      >
        {loading ? <MaterialIcon icon="sync" rotate="left"/> : icon ? <MaterialIcon icon={icon}/> : undefined}<Label>{label}</Label>
      </Overlay>
    </StyledButton>
  );
};

export default Button;
