import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

// Inline, so it also fits into a live region (<span role="status">)
const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.6em 1em;
  background-color: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  color: #2e7d32;
  font-size: 0.9em;
  font-weight: bold;
`;

// The icon's text ("check") is not read out with the message. A flex box,
// so it takes the place of the icon in the pill exactly.
const Icon = styled.span`
  display: flex;
`;

interface SuccessMessageProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Confirms that something was done, e.g. "Gespeichert!" after saving.
 * Without margins: they depend on where it is shown. Other attributes are
 * passed on, e.g. aria-hidden where a live region of its own announces it.
 */
const SuccessMessage = ({ children, ...attributes }: SuccessMessageProps) => (
  <Pill {...attributes}>
    <Icon aria-hidden="true">
      <MaterialIcon icon="check"/>
    </Icon>
    {children}
  </Pill>
);

export default SuccessMessage;
