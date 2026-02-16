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

export const renderWithTheme = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Re-export everything from RTL
export * from '@testing-library/react';
