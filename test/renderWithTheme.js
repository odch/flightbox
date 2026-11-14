import React from 'react';
import {render} from '@testing-library/react';
import {ThemeProvider} from 'styled-components';
import {BrowserRouter} from 'react-router-dom'

const theme = {
  colors: {
    main: '#003863',
    background: '#fafafa',
    danger: '#e00f00'
  },
};

// The providers renderWithTheme wraps a component in, e.g. for rerender
// (which renders exactly what it gets)
export const withTheme = (component) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  </BrowserRouter>
);

export const renderWithTheme = (component) => {
  return render(withTheme(component));
};

// Re-export everything from RTL
export * from '@testing-library/react';
