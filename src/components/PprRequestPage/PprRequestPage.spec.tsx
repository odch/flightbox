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
    dismissPprSubmitFailure: jest.fn(),
  };

  // Guest sessions too: the request is behind the login
  it.each([[false], [true]])('shows the navigation and the start page behind the logo (without login: %p)', withoutLogin => {
    render(<PprRequestPage {...props} withoutLogin={withoutLogin}/>);

    expect(screen.getByTestId('jump-nav')).toBeTruthy();
    expect(screen.getByTestId('layout')).not.toHaveAttribute('data-home-path');
  });

  it('passes the form the request with login', () => {
    const confirmPprSubmitSuccess = jest.fn();
    render(<PprRequestPage {...props} confirmPprSubmitSuccess={confirmPprSubmitSuccess}/>);

    expect(formProps()).toEqual(expect.objectContaining({
      initialValues: { plannedTime: '10:30' },
      onSubmit: props.onSubmit,
      confirmPprSubmitSuccess,
      withoutLogin: undefined,
    }));
  });

  it('passes the form the request without login', () => {
    render(
      <PprRequestPage
        {...props}
        withoutLogin
        rateLimited
      />
    );

    expect(formProps()).toEqual(expect.objectContaining({
      onSubmit: props.onSubmit,
      dismissPprSubmitFailure: props.dismissPprSubmitFailure,
      withoutLogin: true,
      rateLimited: true,
    }));
  });

  it.each([[false], [true]])('passes the form the closures (without login: %p)', withoutLogin => {
    const closures = [{ from: '2026-11-20', to: '2026-11-22', reason: 'Runway works' }];
    render(<PprRequestPage {...props} withoutLogin={withoutLogin} closures={closures}/>);

    expect(formProps().closures).toBe(closures);
  });
});
