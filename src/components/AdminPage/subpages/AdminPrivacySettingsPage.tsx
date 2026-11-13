import React from 'react';
import PrivacySettingsForm from '../../../containers/PrivacySettingsFormContainer';

// The privacy settings and the retention of PPR requests are enabled per
// aerodrome (privacySettings, ppr in projects/<name>.json)
const AdminPrivacySettingsPage = () => {
  return (
    <PrivacySettingsForm
      privacyEnabled={__CONF__.privacySettings === true}
      pprEnabled={__CONF__.ppr === true}
    />
  );
};

export default AdminPrivacySettingsPage;
