import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { DayButton, labelDayButton } from 'react-day-picker';
import type { DayButtonProps, Matcher } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { enGB } from 'date-fns/locale/en-GB';
import dates from '../../util/dates';
import DayPicker, { BLOCKED_BACKGROUND, BLOCKED_CLASS, BLOCKED_COLOR } from './DayPicker';

// Days that can be chosen but are blocked for a reason (e.g. the closures of
// the PPR form), from and to as 'YYYY-MM-DD'
export interface BlockedPeriod {
  from: string;
  to: string;
  reason: string;
}

// The date a day of the calendar shows, as a click on it chooses it
// (DatePicker): its days are midnight of the browser's time zone
const dateOf = (day: Date) => format(day, 'yyyy-MM-dd');

const reasonsOn = (periods: BlockedPeriod[], date: string) =>
  Array.from(new Set(
    periods.filter(period => period.from <= date && date <= period.to).map(period => period.reason)
  ));

const pad = (value: number) => String(value).padStart(2, '0');

// The periods with days in the month the calendar shows
const periodsIn = (periods: BlockedPeriod[], month: Date) => {
  const monthPrefix = `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;
  return periods.filter(period => period.from <= `${monthPrefix}-31` && period.to >= `${monthPrefix}-01`);
};

const formatPeriod = (period: BlockedPeriod) =>
  period.from === period.to
    ? dates.formatDate(period.from)
    : `${dates.formatDate(period.from)} – ${dates.formatDate(period.to)}`;

// As wide as the calendar: the list below it wraps instead of widening it.
// The dialog it opens in stays put, so a long list scrolls within it on
// small screens.
const Content = styled.div`
  display: inline-flex;
  flex-direction: column;
  max-width: 100%;
  max-height: calc(100vh - 4em);
  overflow-y: auto;
`;

const Blocked = styled.div`
  width: 0;
  min-width: 100%;
  margin-top: 0.5em;
  font-size: 0.9em;
  line-height: 1.4;
`;

const BlockedTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;
  font-weight: bold;
`;

// As the blocked days are marked in the calendar (DayPicker)
const Swatch = styled.span`
  width: 0.9em;
  height: 0.9em;
  border-radius: 50%;
  background: ${BLOCKED_BACKGROUND};
  border: 1px solid ${BLOCKED_COLOR};
`;

const BlockedList = styled.ul`
  margin: 0.25em 0 0;
  padding: 0;
  list-style: none;

  li + li {
    margin-top: 0.4em;
  }
`;

// The days on a line of their own, the reason below
const Period = styled.div`
  font-weight: bold;
`;

interface CalendarProps {
  // 'YYYY-MM-DD'
  value?: string | null;
  onSelect: (date: Date | null | undefined) => void;
  // Whether the date can be removed by clicking it again
  clearable: boolean;
  blockedPeriods?: BlockedPeriod[];
}

const NO_PERIODS: BlockedPeriod[] = [];

/**
 * The month view of the date picker. Blocked days are marked, tell their
 * reasons on hover and to screen readers, and are listed below the month,
 * for touch screens; they can still be chosen.
 */
const Calendar = ({ value, onSelect, clearable, blockedPeriods = NO_PERIODS }: CalendarProps) => {
  const { t, i18n } = useTranslation();
  // Midnight of the browser's time zone, as the calendar's days
  const selected = value ? parseISO(value) : undefined;
  const [month, setMonth] = useState<Date>(() => selected || new Date());

  const { modifiers, components, labels } = useMemo(() => {
    const reasonsOf = (day: Date) => reasonsOn(blockedPeriods, dateOf(day)).join(' · ');
    const blocked: Matcher = (day: Date) => reasonsOn(blockedPeriods, dateOf(day)).length > 0;
    return {
      modifiers: { blocked },
      components: {
        DayButton: (props: DayButtonProps) => (
          <DayButton {...props} title={props.modifiers.blocked ? reasonsOf(props.day.date) : undefined}/>
        ),
      },
      labels: {
        labelDayButton: (...args: Parameters<typeof labelDayButton>) => {
          const [date, dayModifiers] = args;
          const label = labelDayButton(...args);
          return dayModifiers.blocked ? `${label}, ${t('datePicker.blocked')}: ${reasonsOf(date)}` : label;
        },
      },
    };
  }, [blockedPeriods, t]);

  const shownPeriods = periodsIn(blockedPeriods, month);

  return (
    <Content>
      <DayPicker
        mode="single"
        required={!clearable}
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        locale={i18n?.language === 'en' ? enGB : de}
        weekStartsOn={1}
        modifiers={modifiers}
        modifiersClassNames={{ blocked: BLOCKED_CLASS }}
        components={components}
        labels={labels}
      />
      {shownPeriods.length > 0 && (
        <Blocked data-cy="date-picker-blocked">
          <BlockedTitle><Swatch/>{t('datePicker.blocked')}</BlockedTitle>
          <BlockedList>
            {shownPeriods.map(period => (
              <li key={`${period.from}-${period.to}-${period.reason}`}>
                <Period>{formatPeriod(period)}</Period>
                {period.reason}
              </li>
            ))}
          </BlockedList>
        </Blocked>
      )}
    </Content>
  );
};

export default Calendar;
