import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../VerticalHeaderLayout', () => {
  const React = require('react');
  return function MockLayout({ children, homePath }) {
    return <div data-testid="layout" data-home-path={homePath}>{children}</div>;
  };
});

jest.mock('../JumpNavigation', () => {
  const React = require('react');
  return function MockJumpNav() {
    return <nav data-testid="jump-nav"/>;
  };
});

jest.mock('../PprRequestForm', () => {
  const React = require('react');
  return jest.fn(() => <form data-testid="ppr-form"/>);
});

import PprRequestPage from './PprRequestPage';
import PprRequestForm from '../PprRequestForm';

const formProps = () => {
  const calls = (PprRequestForm as unknown as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

describe('PprRequestPage', () => {
  const props = {
    submitting: false,
    submitted: false,
    result: null,
    commitFailed: false,
    initialValues: { plannedTime: '10:30' },
    initPprForm: jest.fn(),
    onSubmit: jest.fn(),
    resetPprForm: jest.fn(),
  };

  it('shows logins the navigation, and the start page behind the logo', () => {
    render(<PprRequestPage {...props}/>);

    expect(screen.getByTestId('jump-nav')).toBeTruthy();
    expect(screen.getByTestId('layout')).not.toHaveAttribute('data-home-path');
  });

  it('shows visitors no navigation to pages behind the login, and the PPR intro behind the logo', () => {
    render(<PprRequestPage {...props} withoutLogin visitor/>);

    expect(screen.queryByTestId('jump-nav')).toBeNull();
    expect(screen.getByTestId('layout')).toHaveAttribute('data-home-path', '/ppr/new');
  });

  it('passes the form the request with login', () => {
    const confirmPprSubmitSuccess = jest.fn();
    render(<PprRequestPage {...props} confirmPprSubmitSuccess={confirmPprSubmitSuccess}/>);

    expect(formProps()).toEqual(expect.objectContaining({
      initialValues: { plannedTime: '10:30' },
      onSubmit: props.onSubmit,
      confirmPprSubmitSuccess,
      withoutLogin: undefined,
      visitor: undefined,
    }));
  });

  it('passes the form the request without login', () => {
    render(
      <PprRequestPage
        {...props}
        withoutLogin
        visitor
        rateLimited
        privacyPolicyUrl="https://aerodrome.ch/privacy"
      />
    );

    expect(formProps()).toEqual(expect.objectContaining({
      onSubmit: props.onSubmit,
      withoutLogin: true,
      visitor: true,
      rateLimited: true,
      privacyPolicyUrl: 'https://aerodrome.ch/privacy',
    }));
  });
});
