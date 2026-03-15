import React from 'react';

const newLineToBr = (str: string | null | undefined): React.ReactNode =>
  str
    ? str.split('\n').map((line, index) => <span key={index}>{line}<br/></span>)
    : str;

export default newLineToBr;
