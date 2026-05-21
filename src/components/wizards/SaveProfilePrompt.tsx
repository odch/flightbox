import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import { addAircraft, updateAircraft, saveProfile } from '../../modules/profile';
import { toAircraftsArray, Aircraft } from '../../modules/profile/migration';

const Bar = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.6em 1em;
  margin: 0.5em auto;
  background-color: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 6px;
  color: #666;
  font-size: 0.9em;
`;

const StarIcon = styled.span`
  color: #e8a735;
  display: flex;
  align-items: center;
`;

const SaveLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  font-weight: bold;
  cursor: pointer;
  color: ${props => props.theme.colors.main};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  padding: 0.2em;
  cursor: pointer;
  color: #bbb;
  font-size: 1.1em;
  display: flex;
  align-items: center;

  &:hover {
    color: #666;
  }
`;

const SuccessMessage = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.6em 1em;
  margin: 0.5em auto;
  background-color: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  color: #2e7d32;
  font-size: 0.9em;
  font-weight: bold;
`;

interface SaveProfilePromptProps {
  wizardValues: Record<string, any>;
  profileAircrafts: Aircraft[];
  profileHasPersonalData: boolean;
  auth: any;
  addAircraft: (aircraft: Aircraft) => void;
  updateAircraft: (index: number, aircraft: Aircraft) => void;
  saveProfile: (values: Record<string, unknown>) => void;
}

const SaveProfilePrompt: React.FC<SaveProfilePromptProps> = ({
  wizardValues,
  profileAircrafts,
  profileHasPersonalData,
  auth,
  addAircraft,
  updateAircraft,
  saveProfile,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<'prompt' | 'confirmed' | 'dismissed'>('prompt');


  if (typeof __CONF__ !== 'undefined' && __CONF__.profileEnabled === false) {
    return null;
  }

  if (!auth || auth.guest || auth.kiosk) {
    return null;
  }

  if (state === 'dismissed' || !wizardValues?.immatriculation) {
    return null;
  }

  if (state === 'confirmed') {
    return (
      <SuccessMessage>
        <MaterialIcon icon="check"/>
        {t('common.saved')}
      </SuccessMessage>
    );
  }

  const movementAircraft: Aircraft = {
    immatriculation: wizardValues.immatriculation,
    aircraftType: wizardValues.aircraftType || null,
    mtow: wizardValues.mtow ?? null,
    aircraftCategory: wizardValues.aircraftCategory || null,
  };

  const existingIndex = profileAircrafts.findIndex(
    a => a.immatriculation === movementAircraft.immatriculation
  );
  const existing = existingIndex >= 0 ? profileAircrafts[existingIndex] : null;

  const aircraftChanged = existing && (
    existing.aircraftType !== movementAircraft.aircraftType ||
    existing.mtow !== movementAircraft.mtow ||
    existing.aircraftCategory !== movementAircraft.aircraftCategory
  );

  // Determine prompt mode
  let promptKey: string | null = null;
  let onConfirm: () => void;

  if (!profileHasPersonalData) {
    promptKey = 'profile.saveDetailsPrompt';
    onConfirm = () => {
      saveProfile({
        firstname: wizardValues.firstname || null,
        lastname: wizardValues.lastname || null,
        email: wizardValues.email || null,
        phone: wizardValues.phone || null,
        memberNr: wizardValues.memberNr || null,
      });
      if (!existing) {
        addAircraft(movementAircraft);
      } else if (aircraftChanged) {
        updateAircraft(existingIndex, movementAircraft);
      }
      setState('confirmed');
    };
  } else if (!existing) {
    promptKey = 'profile.saveAircraftPrompt';
    onConfirm = () => {
      addAircraft(movementAircraft);
      setState('confirmed');
    };
  } else if (aircraftChanged) {
    promptKey = 'profile.updateAircraftPrompt';
    onConfirm = () => {
      updateAircraft(existingIndex, movementAircraft);
      setState('confirmed');
    };
  } else {
    return null;
  }

  return (
    <Bar>
      <StarIcon><MaterialIcon icon="star"/></StarIcon>
      {t(promptKey, { immatriculation: movementAircraft.immatriculation })}
      <SaveLink type="button" onClick={onConfirm}>{t('common.save')}</SaveLink>
      <DismissButton type="button" onClick={() => setState('dismissed')} aria-label="dismiss">
        <MaterialIcon icon="close"/>
      </DismissButton>
    </Bar>
  );
};

const mapStateToProps = (state: any) => {
  const profile = state.profile.profile;
  const aircrafts = toAircraftsArray(profile?.aircrafts) || [];
  return {
    wizardValues: state.ui.wizard.values,
    profileAircrafts: aircrafts,
    profileHasPersonalData: !!(profile?.firstname && profile?.lastname),
    auth: state.auth.data,
  };
};

const mapDispatchToProps = {
  addAircraft,
  updateAircraft,
  saveProfile,
};

export default connect(mapStateToProps, mapDispatchToProps)(SaveProfilePrompt);
