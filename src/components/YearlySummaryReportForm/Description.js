import React from 'react';
import styled from 'styled-components';

const Dl = styled.dl`
  margin: 1em 0 2em 0;
`;

const Dt = styled.dt`
  font-size: 1em;
  margin-bottom: 0.5em;
  font-weight: 200;
  float: left;
  wiDth: 150px;
`;

const Dd = styled.dd`
  margin-bottom: 1em;
  margin-left: 150px;
`;

const Description = () => (
  <div>
    Die Jahreszusammenfassung enthält für jeden Monat des Jahres eine Zeile mit den folgenden Informationen:
    <Dl>
      <Dt>Month</Dt>
      <Dd>Der Monat</Dd>
      <Dt>RWY{__CONF__.aerodrome.runways[0].name}</Dt>
      <Dd>Anzahl Bewegungen auf Piste {__CONF__.aerodrome.runways[0].name}</Dd>
      <Dt>RWY{__CONF__.aerodrome.runways[1].name}</Dt>
      <Dd>Anzahl Bewegungen auf Piste {__CONF__.aerodrome.runways[1].name}</Dd>
      <Dt>PrivatePax</Dt>
      <Dd>Anzahl Passagiere bei privaten Bewegungen</Dd>
      <Dt>PrivateLocal</Dt>
      <Dd>Anzahl Bewegungen bei privaten Lokalflügen</Dd>
      <Dt>PrivateAway</Dt>
      <Dd>Anzahl Bewegungen bei privaten Nicht-Lokalflügen</Dd>
      <Dt>PrivateCircuits</Dt>
      <Dd>Anzahl Bewegungen bei privaten Platzrunden</Dd>
      <Dt>InstructionPax</Dt>
      <Dd>Anzahl Passagiere bei Schulungsflügen</Dd>
      <Dt>InstructionLocal</Dt>
      <Dd>Anzahl Bewegungen bei lokalen Schulungsflügen</Dd>
      <Dt>InstructionAway</Dt>
      <Dd>Anzahl Bewegungen bei nicht-lokalen Schulungsflügen</Dd>
      <Dt>InstructionCircuits</Dt>
      <Dd>Anzahl Bewegungen bei Schulungs-Platzrunden</Dd>
      <Dt>CommercialPax</Dt>
      <Dd>Anzahl Passagiere bei kommerziellen Flügen</Dd>
      <Dt>CommercialLocal</Dt>
      <Dd>Anzahl Bewegungen bei kommerziellen Lokalflügen</Dd>
      <Dt>Helicopter</Dt>
      <Dd>Anzahl Bewegungen mit Helikoptern</Dd>
      <Dt>Total</Dt>
      <Dd>Totale Anzahl Bewegungen</Dd>
      <Dt>TotalCircuits</Dt>
      <Dd>Totale Anzahl Bewegungen (nur Platzrunden-Flüge)</Dd>
    </Dl>
  </div>
);

export default Description;
