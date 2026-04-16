import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components'
import Centered from '../Centered'
import MaterialIcon from '../MaterialIcon'
import JumpNavigation from '../JumpNavigation'
import VerticalHeaderLayout from '../VerticalHeaderLayout'
import ProfileForm from './ProfileForm'
import AircraftList from './AircraftList'
import type { Aircraft } from '../../modules/profile/migration'

const Content = styled.div`
  padding: 2em;
`;

const FormLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

interface ProfilePageProps {
  profile: Record<string, unknown> | undefined;
  saving: boolean;
  loadProfile: () => void;
  saveProfile: (values: Record<string, unknown>) => void;
  addAircraft: (aircraft: Aircraft) => void;
  updateAircraft: (index: number, aircraft: Aircraft) => void;
  removeAircraft: (index: number) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  saving,
  loadProfile,
  saveProfile,
  addAircraft,
  updateAircraft,
  removeAircraft,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) {
    return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('profile.loading')}</Centered>;
  }

  return (
    <VerticalHeaderLayout>
      <Content>
        <JumpNavigation/>
        <FormLayout>
          <ProfileForm profile={profile} saveProfile={saveProfile} saving={saving}/>
          <AircraftList
            aircrafts={(profile.aircrafts as Aircraft[]) || []}
            addAircraft={addAircraft}
            updateAircraft={updateAircraft}
            removeAircraft={removeAircraft}
          />
        </FormLayout>
      </Content>
    </VerticalHeaderLayout>
  );
};

export default ProfilePage;
