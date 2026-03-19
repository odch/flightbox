import React from 'react';

const ErrorFallback = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}
  >
    <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
      Something went wrong
    </h1>
    <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
      An unexpected error occurred.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: '#fff'
      }}
    >
      Reload
    </button>
  </div>
);

export default ErrorFallback;
