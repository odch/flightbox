import React from 'react';
import LabeledBox from '../../LabeledBox';
import AircraftsItemList from '../../../containers/AircraftsItemListContainer';
import DescriptionText from '../DescriptionText';
import { useTranslation } from 'react-i18next';

const AdminAircraftPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <LabeledBox label={t('adminAircraft.clubAircraftTitle')}>
        <DescriptionText>
          {t('adminAircraft.clubAircraftDesc1')} {t('adminAircraft.clubAircraftDesc2')}
        </DescriptionText>
        <AircraftsItemList type="club"/>
      </LabeledBox>
      <LabeledBox label={t('adminAircraft.homeBaseTitle')}>
        <DescriptionText>
          {t('adminAircraft.homeBaseDesc1')} {t('adminAircraft.homeBaseDesc2')} {t('adminAircraft.homeBaseDesc3')}
        </DescriptionText>
        <AircraftsItemList type="homeBase"/>
      </LabeledBox>
    </>
  );
};

export default AdminAircraftPage;
