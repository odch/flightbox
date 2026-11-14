import React from 'react';
import styled from 'styled-components';
import LabeledBox from '../../LabeledBox';
import AerodromeStatusForm from '../../../containers/AerodromeStatusFormContainer';
import AerodromeStatusBannerToggle from '../../AerodromeStatusBannerToggle';
import { useTranslation } from 'react-i18next';

// "Closed" also rejects PPR requests for today, and the days without PPR
// approvals are set in the PPR tab. The box has no padding: the hint has
// that of the form.
const PprHint = styled.p`
  margin: 0;
  padding: 1em;
  border-top: 1px solid #ddd;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
`;

const AdminAerodromeStatusPage = () => {
  const { t } = useTranslation();
  return (
    <LabeledBox label={t('admin.aerodromeStatus')} contentPadding={0}>
      <AerodromeStatusBannerToggle/>
      <AerodromeStatusForm/>
      {__CONF__.ppr === true && (
        <PprHint data-cy="aerodrome-status-ppr-hint">{t('ppr.aerodromeStatusHint')}</PprHint>
      )}
    </LabeledBox>
  );
};

export default AdminAerodromeStatusPage;
