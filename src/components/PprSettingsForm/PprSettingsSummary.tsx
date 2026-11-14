import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '../Button';
import SuccessMessage from '../SuccessMessage';
import dates from '../../util/dates';
import { ClosureValue, upcomingClosures } from './ClosuresEditor';

// The blocked periods listed; the others are counted
export const MAX_LISTED_CLOSURES = 3;

// As the details of a PPR request (PprRequestList)
const DetailList = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.4em 1.5em;
  margin: 0;

  dt {
    color: #666;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    dd {
      margin-bottom: 0.6em;
    }
  }
`;

const Periods = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const More = styled.li`
  color: #666;
`;

const Warning = styled.span`
  color: #dc3545;
`;

// Right-aligned like the buttons below the form
const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  column-gap: 1em;
  margin-top: 1em;
`;

const EditButton = styled(Button)`
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const SavedMessage = styled(SuccessMessage)`
  @media (max-width: 768px) {
    margin-bottom: 0.5em;
  }
`;

// The first and the last day, or the day
const formatPeriod = (closure: ClosureValue & { to: string }) =>
  closure.from && closure.from !== closure.to
    ? `${dates.formatDate(closure.from)} – ${dates.formatDate(closure.to)}`
    : dates.formatDate(closure.to);

interface PprSettingsSummaryProps {
  answerMode: string;
  adminEmail: string | null;
  closures: ClosureValue[];
  // Confirms a save just made, to the eye: screen readers hear it from the
  // live region of the settings (PprSettingsForm), which stays on the page
  saved: boolean;
  onEdit: () => void;
}

/**
 * The stored PPR settings in short (without the information for pilots),
 * with the button to change them.
 */
const PprSettingsSummary = ({ answerMode, adminEmail, closures, saved, onEdit }: PprSettingsSummaryProps) => {
  const { t } = useTranslation();
  const automatic = answerMode === 'automatic';
  const upcoming = upcomingClosures(closures, dates.localDate());
  const listed = upcoming.slice(0, MAX_LISTED_CLOSURES);

  return (
    <div data-cy="ppr-settings-summary">
      <DetailList>
        <dt>{t('ppr.settings.answer')}</dt>
        <dd data-cy="ppr-settings-summary-answer">
          {automatic ? t('ppr.settings.answerAutomatic') : t('ppr.settings.answerManual')}
        </dd>

        <dt>{t('ppr.settings.closures')}</dt>
        <dd data-cy="ppr-settings-summary-closures">
          {upcoming.length === 0 ? t('ppr.settings.noClosures') : (
            <Periods>
              {listed.map((closure, index) => (
                <li key={index}>{formatPeriod(closure)} · {closure.reason}</li>
              ))}
              {upcoming.length > listed.length && (
                <More>{t('ppr.settings.moreClosures', { count: upcoming.length - listed.length })}</More>
              )}
            </Periods>
          )}
        </dd>

        <dt>{t('ppr.settings.notification')}</dt>
        <dd data-cy="ppr-settings-summary-notification">
          {/* As in the form: unanswered requests nobody hears about */}
          {adminEmail || (automatic ? '-' : <Warning>{t('ppr.settings.noAdminEmail')}</Warning>)}
        </dd>
      </DetailList>

      <Actions>
        {saved && (
          <SavedMessage aria-hidden="true" data-cy="ppr-settings-saved">{t('common.saved')}</SavedMessage>
        )}
        <EditButton icon="edit" label={t('common.edit')} onClick={onEdit} dataCy="ppr-settings-edit"/>
      </Actions>
    </div>
  );
};

export default PprSettingsSummary;
