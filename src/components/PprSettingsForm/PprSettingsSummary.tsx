import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '../Button';
import SuccessMessage from '../SuccessMessage';
import dates from '../../util/dates';
import { ClosureValue, upcomingClosures } from './ClosuresEditor';
import { leavesRequestsToAdmins, NO_MANUAL_ANSWERS } from './manualAnswers';
import type { PprManualAnswers } from '../../modules/ppr/actions';

// The next blocked period is listed; the others are counted
export const MAX_LISTED_CLOSURES = 1;

// A slim bar above the list of requests, which admins use every day: the
// settings in one line, and the buttons for the website link and the form
const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75em 1.5em;
  margin: 0 0 2em;
  padding: 0.75em 1rem;
  border: 1px solid #ddd;
  background-color: ${props => props.theme.colors.background};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.5em;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1em;
  font-weight: bold;

  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

// Each setting with its name, wrapping as a whole
const Settings = styled.dl`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25em 1.25em;
  margin: 0;
`;

const Setting = styled.div`
  display: flex;
  gap: 0.4em;
  min-width: 0;

  dt {
    flex: 0 0 auto;
    color: #666;
    white-space: nowrap;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

const Periods = styled.ul`
  display: inline;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: inline;
  }
`;

const More = styled.li`
  color: #666;

  &::before {
    content: ' ';
  }
`;

const Warning = styled.span`
  color: #dc3545;
`;

const Actions = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5em 1em;

  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

const ActionButton = styled(Button)`
  white-space: nowrap;

  @media (max-width: 768px) {
    flex: 1 1 0;
  }
`;

const SavedMessage = styled(SuccessMessage)`
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

// The first and the last day, or the day
const formatPeriod = (closure: ClosureValue & { to: string }) =>
  closure.from && closure.from !== closure.to
    ? `${dates.formatDate(closure.from)} – ${dates.formatDate(closure.to)}`
    : dates.formatDate(closure.to);

// The answer mode, with the aircraft an admin answers for despite automatic
// answers
const answerText = (t: (key: string, options?: any) => string, answerMode: string, manualAnswers: PprManualAnswers) => {
  if (answerMode !== 'automatic') {
    return t('ppr.settings.answerManual');
  }
  const { helicopters, mtowFrom } = manualAnswers;
  if (helicopters && mtowFrom !== null) {
    return t('ppr.settings.answerAutomaticExceptBoth', { mtow: mtowFrom });
  }
  if (helicopters) {
    return t('ppr.settings.answerAutomaticExceptHelicopters');
  }
  if (mtowFrom !== null) {
    return t('ppr.settings.answerAutomaticExceptMtow', { mtow: mtowFrom });
  }
  return t('ppr.settings.answerAutomatic');
};

interface PprSettingsSummaryProps {
  answerMode: string;
  manualAnswers?: PprManualAnswers;
  adminEmail: string | null;
  closures: ClosureValue[];
  // Confirms a save just made, to the eye: screen readers hear it from the
  // live region of the settings (PprSettingsForm), which stays on the page
  saved: boolean;
  onEdit: () => void;
  // Opens the links for the aerodrome's website
  onShowLinks: () => void;
}

/**
 * The stored PPR settings in short (without the information for pilots),
 * with the buttons for the website link and to change them.
 */
const PprSettingsSummary = ({
  answerMode, manualAnswers = NO_MANUAL_ANSWERS, adminEmail, closures, saved, onEdit, onShowLinks,
}: PprSettingsSummaryProps) => {
  const { t } = useTranslation();
  const upcoming = upcomingClosures(closures, dates.localDate());
  const listed = upcoming.slice(0, MAX_LISTED_CLOSURES);

  return (
    <Bar data-cy="ppr-settings-summary">
      <Title>{t('ppr.settings.title')}</Title>
      <Settings>
        <Setting>
          <dt>{t('ppr.settings.answer')}</dt>
          <dd data-cy="ppr-settings-summary-answer">{answerText(t, answerMode, manualAnswers)}</dd>
        </Setting>
        <Setting>
          <dt>{t('ppr.settings.closures')}</dt>
          <dd data-cy="ppr-settings-summary-closures">
            {upcoming.length === 0 ? t('ppr.settings.noClosuresShort') : (
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
        </Setting>
        <Setting>
          <dt>{t('ppr.settings.notification')}</dt>
          <dd data-cy="ppr-settings-summary-notification">
            {/* As in the form: unanswered requests nobody hears about */}
            {adminEmail || (leavesRequestsToAdmins(answerMode, manualAnswers)
              ? <Warning>{t('ppr.settings.noAdminEmail')}</Warning>
              : '-')}
          </dd>
        </Setting>
      </Settings>
      <Actions>
        {saved && (
          <SavedMessage aria-hidden="true" data-cy="ppr-settings-saved">{t('common.saved')}</SavedMessage>
        )}
        <ActionButton
          icon="link"
          label={t('ppr.websiteLink.button')}
          onClick={onShowLinks}
          dataCy="ppr-website-links-open"
        />
        <ActionButton icon="edit" label={t('common.edit')} onClick={onEdit} dataCy="ppr-settings-edit"/>
      </Actions>
    </Bar>
  );
};

export default PprSettingsSummary;
