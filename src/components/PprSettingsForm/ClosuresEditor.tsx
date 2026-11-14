import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import DatePicker from '../DatePicker';
import Button from '../Button';
import MaterialIcon from '../MaterialIcon';
import ValidationMessage from '../LabeledComponent/ValidationMessage';

export interface ClosureValue {
  from: string | null;
  to: string | null;
  reason: string;
}

export interface ClosureError {
  dates?: string;
  reason?: string;
}

// The same limits as on the server (functions/ppr/domain/pprSettings.js)
export const MAX_CLOSURES = 50;
export const MAX_CLOSURE_REASON_LENGTH = 300;

const Row = styled.div`
  display: grid;
  grid-template-columns: 9em 9em minmax(0, 1fr) auto;
  grid-template-areas: "from to reason remove";
  gap: 0.5em 1em;
  align-items: end;
  padding: 0.75em 0;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    grid-template-areas:
      "from to remove"
      "reason reason reason";
  }
`;

// Not a <label> for the dates: a click on a label also clicks the first
// button within it
const Cell = styled.div<{ $area: string }>`
  grid-area: ${props => props.$area};
  min-width: 0;
  font-size: 1.1em;
`;

const Caption = styled.span`
  display: block;
  margin-bottom: 0.3em;
  color: #666;
  font-size: 0.8em;
`;

const ReasonInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 1px 0;
  border: 0;
  border-bottom: 1px solid #000;
  border-radius: 0;
  background: none;
  font: inherit;
  line-height: normal;
`;

const RemoveButton = styled.button`
  grid-area: remove;
  padding: 0.2em;
  border: none;
  background: none;
  color: #666;
  font-size: 1.1em;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.colors.danger};
  }
`;

const Errors = styled.div`
  grid-column: 1 / -1;
`;

const Empty = styled.p`
  margin: 0.5em 0;
  color: #666;
  font-style: italic;
`;

const AddButton = styled(Button)`
  margin-top: 0.75em;
`;

interface ClosuresEditorProps {
  value: ClosureValue[];
  onChange: (closures: ClosureValue[]) => void;
  errors?: (ClosureError | undefined)[];
  // Missing values are only pointed out once saving was tried
  showAllErrors: boolean;
}

export const emptyClosure = (): ClosureValue => ({ from: null, to: null, reason: '' });

/**
 * The closures that have not ended by `today` (YYYY-MM-DD, local date);
 * the others reject nothing any more. In the given order: the server
 * returns them sorted by their first day.
 */
export const upcomingClosures = <T extends Pick<ClosureValue, 'to'>>(
  closures: T[] | null | undefined,
  today: string
): (T & { to: string })[] =>
  (closures || []).filter((closure): closure is T & { to: string } => !!closure.to && closure.to >= today);

const ClosuresEditor = ({ value, onChange, errors = [], showAllErrors }: ClosuresEditorProps) => {
  const { t } = useTranslation();
  const closures = value || [];

  const update = (index: number, changes: Partial<ClosureValue>) =>
    onChange(closures.map((closure, i) => i === index ? { ...closure, ...changes } : closure));

  // Most closures are a single day: the end follows a start set after it
  const changeFrom = (index: number, from: string | null) => {
    const { to } = closures[index];
    update(index, from && (!to || to < from) ? { from, to: from } : { from });
  };

  return (
    <div data-cy="ppr-closures">
      {closures.length === 0 && <Empty>{t('ppr.settings.noClosures')}</Empty>}

      {closures.map((closure, index) => {
        const error = errors[index];
        // With both dates set, a date error is the order: shown right away
        const datesError = error?.dates && (showAllErrors || (closure.from && closure.to)) ? error.dates : null;
        const reasonError = error?.reason && showAllErrors ? error.reason : null;
        return (
          <Row key={index} data-cy={`ppr-closure-${index}`}>
            <Cell $area="from">
              <Caption>{t('ppr.settings.closureFrom')}</Caption>
              <DatePicker
                value={closure.from}
                onChange={(e: { value: string | null }) => changeFrom(index, e.value)}
                dataCy={`ppr-closure-${index}-from`}
              />
            </Cell>
            <Cell $area="to">
              <Caption>{t('ppr.settings.closureTo')}</Caption>
              <DatePicker
                value={closure.to}
                onChange={(e: { value: string | null }) => update(index, { to: e.value })}
                dataCy={`ppr-closure-${index}-to`}
              />
            </Cell>
            <Cell as="label" $area="reason">
              <Caption>{t('ppr.settings.closureReason')}</Caption>
              <ReasonInput
                type="text"
                value={closure.reason}
                maxLength={MAX_CLOSURE_REASON_LENGTH}
                onChange={e => update(index, { reason: e.target.value })}
                data-cy={`ppr-closure-${index}-reason`}
              />
            </Cell>
            <RemoveButton
              type="button"
              // Not the second click of a double click: the next closure
              // has moved up under the pointer
              onClick={event => {
                if (event.detail <= 1) {
                  onChange(closures.filter((_, i) => i !== index));
                }
              }}
              title={t('ppr.settings.removeClosure')}
              aria-label={t('ppr.settings.removeClosure')}
              data-cy={`ppr-closure-${index}-remove`}
            >
              <MaterialIcon icon="delete"/>
            </RemoveButton>
            {(datesError || reasonError) && (
              <Errors>
                {datesError && <ValidationMessage error={datesError}/>}
                {reasonError && <ValidationMessage error={reasonError}/>}
              </Errors>
            )}
          </Row>
        );
      })}

      <AddButton
        type="button"
        icon="add"
        label={t('ppr.settings.addClosure')}
        onClick={() => onChange([...closures, emptyClosure()])}
        disabled={closures.length >= MAX_CLOSURES}
        flat
        dataCy="ppr-closure-add"
      />
    </div>
  );
};

export default ClosuresEditor;
