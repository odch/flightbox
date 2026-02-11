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
  wiDth: 200px;
`;

const Dd = styled.dd`
  margin-bottom: 1em;
  margin-left: 200px;
`;

const InternalDescription = () => (
  <div>
    Der interne Report enthält zusätzlich die folgenden Informationen:
    <Dl>
      <Dt>KEY</Dt>
      <Dd>Die Referenznummer der Bewegung</Dd>
      {__CONF__.memberManagement === true && (
        <>
          <Dt>MEMBERNR</Dt>
          <Dd>Die Mitgliedernummer des Piloten</Dd>
        </>
      )}
      <Dt>LASTNAME</Dt>
      <Dd>Der Nachname des Piloten</Dd>
      <Dt>EMAIL</Dt>
      <Dd>Die E-Mail-Adresse des Piloten</Dd>
      <Dt>MTOW</Dt>
      <Dd>Das maximale Abfluggewicht</Dd>
      <Dt>CLUB</Dt>
      <Dd><em>1</em>, wenn Club-Flugzeug, sonst leer</Dd>
      <Dt>HOME_BASE</Dt>
      <Dd><em>1</em>, wenn auf diesem Flugplatz stationiertes Flugzeug (ohne Club-Flugzeuge), sonst leer</Dd>
      <Dt>ORIGINAL_ORIDE</Dt>
      <Dd>Der ursprüngliche Start- oder Zielflugplatz, falls er nicht identifiziert werden konnte
        und durch <em>LSZZ</em> ersetzt wurde</Dd>
      <Dt>REMARKS</Dt>
      <Dd>Bemerkungen</Dd>
      <Dt>FEES</Dt>
      <Dd>Total der Landegebühren</Dd>
      <Dt>LDG_COUNT</Dt>
      <Dd>Anzahl Landungen</Dd>
      <Dt>GA_COUNT</Dt>
      <Dd>Anzahl Durchstarts</Dd>
      <Dt>PAYMENT_METHOD</Dt>
      <Dd>Die gewählte Zahlungsart</Dd>
      <Dt>INVOICE_RECIPIENT</Dt>
      <Dd>Name des Rechnungsempfängers bei Zahlungsart "Rechnung"</Dd>
    </Dl>
  </div>
);

export default InternalDescription;
