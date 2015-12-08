import React, { PropTypes } from 'react';
import './App.scss';

function App({ children }) {
  return (
    <div className="App">
      {children}
    </div>
  );
}

App.propTypes = {
  children: PropTypes.element.isRequired,
};

export default App;

