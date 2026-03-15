import React from 'react';
import Header from './Header';
import Content from './Content';

function VerticalHeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header/>
      <Content>{children}</Content>
    </div>
  );
}

export default VerticalHeaderLayout;
