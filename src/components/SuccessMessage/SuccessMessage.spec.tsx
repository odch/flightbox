import React from 'react';
import styled from 'styled-components';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';
import SuccessMessage from './SuccessMessage';

describe('SuccessMessage', () => {
  it('shows the message with a check mark, in green', () => {
    renderWithTheme(<SuccessMessage>Gespeichert!</SuccessMessage>);

    const message = screen.getByText('Gespeichert!');
    expect(message.querySelector('i')).toHaveTextContent('check');
    expect(message).toHaveStyle('color: #2e7d32');
    expect(message).toHaveStyle('background-color: #e8f5e9');
    expect(message).toHaveStyle('font-weight: bold');
  });

  it('reads only the message, not the text of the icon', () => {
    renderWithTheme(<SuccessMessage>Gespeichert!</SuccessMessage>);

    const icon = screen.getByText('Gespeichert!').querySelector('i');
    expect(icon!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('passes other attributes on', () => {
    renderWithTheme(<SuccessMessage aria-hidden="true" data-cy="saved">Gespeichert!</SuccessMessage>);

    const message = screen.getByText('Gespeichert!');
    expect(message).toHaveAttribute('aria-hidden', 'true');
    expect(message).toHaveAttribute('data-cy', 'saved');
  });

  it('can be placed by the surrounding component', () => {
    const Centered = styled(SuccessMessage)`
      margin: 0.5em auto;
    `;
    renderWithTheme(<Centered>Gespeichert!</Centered>);

    expect(screen.getByText('Gespeichert!')).toHaveStyle('margin: 0.5em auto');
  });
});
