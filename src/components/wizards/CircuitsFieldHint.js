import React from 'react';
import FieldHint, {Strong} from './FieldHint';

const CircuitsFieldHint = () => (
  <FieldHint caption="Bitte beachten">
    <div>Bitte auch bei Platzrunden Abflug <Strong>und</Strong> Ankunft erfassen.</div>
  </FieldHint>
);

export default CircuitsFieldHint;
