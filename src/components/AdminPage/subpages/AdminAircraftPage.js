import React from 'react';
import LabeledBox from '../../LabeledBox';
import AircraftsItemList from '../../../containers/AircraftsItemListContainer';
import DescriptionText from '../DescriptionText';

const AdminAircraftPage = () => {
  return (
    <>
      <LabeledBox label="Club-Flugzeuge">
        <DescriptionText>
          Geben Sie hier die Immatrikulationen der Club-Flugzeuge ein.
          Die Immatrikulationen dürfen nur Grossbuchstaben und Zahlen enthalten.
        </DescriptionText>
        <AircraftsItemList type="club"/>
      </LabeledBox>
      <LabeledBox label="Auf diesem Flugplatz stationierte Flugzeuge (ohne Club-Flugzeuge)">
        <DescriptionText>
          Geben Sie hier die Immatrikulationen aller auf diesem Flugplatz stationierten Flugzeuge ein
          (ohne die Club-Flugzeuge).
          Die Immatrikulationen dürfen nur Grossbuchstaben und Zahlen enthalten.
        </DescriptionText>
        <AircraftsItemList type="homeBase"/>
      </LabeledBox>
    </>
  );
};

export default AdminAircraftPage;
