import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import dates from '../../util/dates';
import {CustomsSyncStatus as SyncStatus} from '../../modules/settings/customsSyncStatus';

const Wrapper = styled.div<{ $failed: boolean }>`
  margin: 0 0 1em 0;
  color: ${props => props.$failed ? props.theme.colors.danger : '#666'};
`;

const Line = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
`;

const Rejected = styled.div`
  margin-top: 0.5em;
  color: ${props => props.theme.colors.danger};
`;

const RejectedList = styled.ul`
  margin: 0.25em 0 0 2em;
  list-style: disc;
  overflow-wrap: anywhere;
`;

interface Props {
  status?: SyncStatus | null;
}

const isKnownStatus = (status: Props['status']): status is SyncStatus =>
  !!status &&
  (status.status === 'ok' || status.status === 'error') &&
  typeof status.timestamp === 'string' &&
  !isNaN(Date.parse(status.timestamp));

// Shows the outcome of the last push of a list to the customs declaration
// app (written by the Cloud Functions). Nothing is shown before the first
// push. Only fixed texts are shown, never the response of the customs app.
const CustomsSyncStatus = ({status}: Props) => {
  const {t, i18n} = useTranslation();

  if (!isKnownStatus(status)) {
    return null;
  }

  const dateTime = dates.formatDateTime(status.timestamp, i18n.language);

  if (status.status === 'error') {
    return (
      <Wrapper $failed={true} role="alert">
        <Line>
          <MaterialIcon icon="sync_problem"/>
          <span>{t('customsSyncStatus.error', {dateTime})}</span>
        </Line>
      </Wrapper>
    );
  }

  const rejected = Array.isArray(status.rejected)
    ? status.rejected.filter(entry => typeof entry === 'string')
    : [];

  return (
    <Wrapper $failed={false} role="status">
      <Line>
        <MaterialIcon icon="sync"/>
        <span>{t('customsSyncStatus.ok', {dateTime})}</span>
      </Line>
      {rejected.length > 0 && (
        <Rejected>
          {t('customsSyncStatus.rejected')}
          <RejectedList>
            {rejected.map((entry, index) => <li key={index}>{entry}</li>)}
          </RejectedList>
        </Rejected>
      )}
    </Wrapper>
  );
};

CustomsSyncStatus.propTypes = {
  status: PropTypes.shape({
    status: PropTypes.string,
    timestamp: PropTypes.string,
    rejected: PropTypes.arrayOf(PropTypes.string),
    httpStatus: PropTypes.number,
  }),
};

export default CustomsSyncStatus;
