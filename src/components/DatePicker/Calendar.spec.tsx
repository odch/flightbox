import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'de' } }),
}));

import Calendar from './Calendar';

const PERIODS = [
  { from: '2026-11-24', to: '2026-11-26', reason: 'Runway works' },
  { from: '2026-11-26', to: '2026-11-26', reason: 'Air show' },
  { from: '2026-11-30', to: '2026-12-02', reason: 'Camp' },
  { from: '2026-12-24', to: '2026-12-26', reason: 'Christmas' },
];

const renderCalendar = (props = {}) => {
  const onSelect = jest.fn();
  const result = renderWithTheme(
    <Calendar value="2026-11-20" onSelect={onSelect} clearable={false} blockedPeriods={PERIODS} {...props}/>
  );
  return { ...result, onSelect };
};

// The cell of a day ('YYYY-MM-DD') in the shown month
const dayCell = (container: HTMLElement, date: string) =>
  container.querySelector(`td[data-day="${date}"]`) as HTMLElement;

const dayButton = (container: HTMLElement, date: string) =>
  dayCell(container, date).querySelector('button') as HTMLButtonElement;

const blockedList = (container: HTMLElement) =>
  container.querySelector('[data-cy="date-picker-blocked"]') as HTMLElement | null;

// Each period with its days and reason
const listed = (container: HTMLElement) =>
  Array.from(blockedList(container)!.querySelectorAll('li'))
    .map(item => `${item.firstElementChild!.textContent} · ${item.lastChild!.textContent}`);

describe('Calendar', () => {
  it('shows the month of the date', () => {
    const { container } = renderCalendar();
    expect(dayCell(container, '2026-11-20')).toHaveClass('rdp-selected');
  });

  it('marks the days of the blocked periods', () => {
    const { container } = renderCalendar();

    ['2026-11-24', '2026-11-25', '2026-11-26', '2026-11-30'].forEach(date => {
      expect(dayCell(container, date)).toHaveClass('blocked-day');
    });
    ['2026-11-20', '2026-11-23', '2026-11-27', '2026-11-29'].forEach(date => {
      expect(dayCell(container, date)).not.toHaveClass('blocked-day');
    });
  });

  it('tells the reasons of a blocked day on hover', () => {
    const { container } = renderCalendar();

    expect(dayButton(container, '2026-11-24')).toHaveAttribute('title', 'Runway works');
    expect(dayButton(container, '2026-11-26')).toHaveAttribute('title', 'Runway works · Air show');
    expect(dayButton(container, '2026-11-23')).not.toHaveAttribute('title');
  });

  it('tells screen readers that a day is blocked, and why', () => {
    const { container } = renderCalendar();

    expect(dayButton(container, '2026-11-25').getAttribute('aria-label'))
      .toMatch(/, datePicker\.blocked: Runway works$/);
    expect(dayButton(container, '2026-11-23').getAttribute('aria-label')).not.toContain('datePicker.blocked');
  });

  it('lets a blocked day be chosen', () => {
    const { container, onSelect } = renderCalendar();

    fireEvent.click(dayButton(container, '2026-11-25'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const chosen = onSelect.mock.calls[0][0] as Date;
    expect([chosen.getFullYear(), chosen.getMonth() + 1, chosen.getDate()]).toEqual([2026, 11, 25]);
  });

  it('lists the blocked periods with days in the shown month, for touch screens', () => {
    const { container } = renderCalendar();

    expect(blockedList(container)!.textContent).toContain('datePicker.blocked');
    expect(listed(container)).toEqual([
      '24.11.2026 – 26.11.2026 · Runway works',
      '26.11.2026 · Air show',
      '30.11.2026 – 02.12.2026 · Camp',
    ]);
  });

  it('lists the blocked periods of the month it is turned to', () => {
    const { container } = renderCalendar();

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    expect(dayCell(container, '2026-12-25')).toHaveClass('blocked-day');
    expect(listed(container)).toEqual([
      '30.11.2026 – 02.12.2026 · Camp',
      '24.12.2026 – 26.12.2026 · Christmas',
    ]);
  });

  it('lists nothing for a month without blocked days', () => {
    const { container } = renderCalendar({ value: '2026-10-15' });
    expect(blockedList(container)).toBeNull();
  });

  it('marks nothing without blocked periods', () => {
    const { container } = renderCalendar({ blockedPeriods: undefined });

    expect(container.querySelector('.blocked-day')).toBeNull();
    expect(container.querySelector('button[title]')).toBeNull();
    expect(blockedList(container)).toBeNull();
  });

  it('opens on the current month without a date', () => {
    const { container } = renderCalendar({ value: null });
    expect(container.querySelector('td.rdp-today')).not.toBeNull();
  });
});
