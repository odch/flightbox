import React from 'react';

const newLineToBr = str =>
  str
    ? str.split('\n').map((line, index) => <span key={index}>{line}<br/></span>)
    : str;

export default newLineToBr;
