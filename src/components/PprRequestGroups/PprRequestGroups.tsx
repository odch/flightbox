import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import dates from '../../util/dates';
import { groupPprRequests } from '../../modules/ppr/groups';

// Past requests shown before "Ältere anzeigen", the most recent ones
export const PAST_SHOWN = 10;

const GROUPS = ['open', 'upcoming', 'past'] as const;

// Like the groups of the movement list: a heading above each group, and
// space between the groups
const Group = styled.div<{ $inset?: boolean }>`
  margin-top: 1.75em;

  &:first-child {
    margin-top: ${props => props.$inset ? '0.25em' : '0'};
  }

  &:last-child {
    margin-bottom: ${props => props.$inset ? '1rem' : '0'};
  }
`;

const Title = styled.h3<{ $inset?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin: 0;
  padding: ${props => props.$inset ? '0 1rem 0.6em' : '0 0 0.6em'};
  font-size: 1.1em;
  font-weight: 600;
  color: #222;
`;

// The open requests wait for an answer: their count stands out
const Count = styled.span<{ $open?: boolean }>`
  padding: 0.1em 0.55em;
  border-radius: 1em;
  background-color: ${props => props.$open ? props.theme.colors.main : '#8a96a3'};
  color: #fff;
  font-size: 0.75em;
  font-weight: 600;
`;

// The rows of a group in the admin list, on a card like the movements
const Card = styled.div`
  margin: 0 1rem;
  background-color: #fff;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0, 0, 0, .12), 0 2px 4px rgba(0, 0, 0, .24);
`;

const ShowOlder = styled.div<{ $inset?: boolean }>`
  padding: ${props => props.$inset ? '0.75em 1rem 0' : '0.5em 0 0'};
`;

interface GroupableRequest {
  key: string;
  status: string;
  plannedDate?: string;
  plannedTime?: string;
}

interface PprRequestGroupsProps<T extends GroupableRequest> {
  requests: T[];
  renderRequest: (request: T) => React.ReactNode;
  // A request to show even when it is among the older past ones (the
  // request of a link in the aerodrome's email)
  revealKey?: string | null;
  // Within a box without padding (the admin list), with rows without a
  // frame of their own: the rows of each group are put on a card, and the
  // titles and the button keep the card's distance from the box's edge
  inset?: boolean;
  headingLevel?: 'h2' | 'h3';
}

// The requests in the groups of groupPprRequests, each with a title and
// its count; groups without requests are left out. Of the past requests,
// the most recent ones are shown, the others on request.
const PprRequestGroups = <T extends GroupableRequest>({
  requests, renderRequest, revealKey, inset, headingLevel = 'h3',
}: PprRequestGroupsProps<T>) => {
  const { t } = useTranslation();
  const [showOlder, setShowOlder] = useState(false);
  const groups = groupPprRequests(requests, dates.localDate());

  const revealIndex = revealKey ? groups.past.findIndex(request => request.key === revealKey) : -1;
  const allPastShown = showOlder || revealIndex >= PAST_SHOWN;
  const olderCount = allPastShown ? 0 : Math.max(groups.past.length - PAST_SHOWN, 0);
  const rows = (shown: T[]) => shown.map(request => (
    <React.Fragment key={request.key}>{renderRequest(request)}</React.Fragment>
  ));

  return (
    <>
      {GROUPS.map(name => {
        const all = groups[name];
        if (all.length === 0) {
          return null;
        }
        const shown = name === 'past' && olderCount > 0 ? all.slice(0, PAST_SHOWN) : all;
        return (
          <Group key={name} $inset={inset} data-cy={`ppr-group-${name}`}>
            <Title as={headingLevel} $inset={inset}>
              {t(`ppr.groups.${name}`)} <Count $open={name === 'open'}>{all.length}</Count>
            </Title>
            {inset ? <Card>{rows(shown)}</Card> : rows(shown)}
            {name === 'past' && olderCount > 0 && (
              <ShowOlder $inset={inset}>
                <Button
                  type="button"
                  icon="expand_more"
                  label={t('ppr.groups.showOlder', { count: olderCount })}
                  onClick={() => setShowOlder(true)}
                  flat
                  dataCy="ppr-show-older"
                />
              </ShowOlder>
            )}
          </Group>
        );
      })}
    </>
  );
};

export default PprRequestGroups;
