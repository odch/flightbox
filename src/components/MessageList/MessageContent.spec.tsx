import React from 'react';
import {renderWithTheme, screen} from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: key => key}),
}));

import MessageContent from './MessageContent';

const baseItem = {
  key: '-abc123',
  name: 'Hans Muster',
  timestamp: 1700000000000,
  email: 'hans@example.com',
  message: 'Hello there',
};

describe('MessageContent', () => {
  it('renders phone row when phone is present', () => {
    renderWithTheme(<MessageContent item={{...baseItem, phone: '0791234567'}} />);
    expect(screen.getByText('0791234567')).toBeDefined();
    expect(screen.getByText('message.phoneLabel')).toBeDefined();
  });

  it('does not render phone row when phone is missing', () => {
    renderWithTheme(<MessageContent item={baseItem} />);
    expect(screen.queryByText('message.phoneLabel')).toBeNull();
  });

  it('does not render phone row when phone is empty string', () => {
    renderWithTheme(<MessageContent item={{...baseItem, phone: ''}} />);
    expect(screen.queryByText('message.phoneLabel')).toBeNull();
  });

  it('renders email and message', () => {
    renderWithTheme(<MessageContent item={baseItem} />);
    expect(screen.getByText('hans@example.com')).toBeDefined();
    expect(screen.getByText('Hello there')).toBeDefined();
  });
});
