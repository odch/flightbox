import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import styled, {useTheme} from 'styled-components';
import {useTranslation} from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import {getLabel} from '../AerodromeStatusForm/StatusOptions';
import newLineToBr from '../../util/newLineToBr';
import dates from '../../util/dates';

const icons: { [key: string]: string } = {
  open: 'check_circle',
  restricted: 'warning',
  closed: 'block',
};

// Severity accents kept deliberately muted and used only on the status icon and
// label, so the banner adopts the project's neutral card background instead of a
// saturated fill that would clash with the logo or theme color.
const accentFor = (status: string, theme: any) => {
  switch (status) {
    case 'open':
      return '#2e7d32';
    case 'restricted':
      return '#b26a00';
    case 'closed':
      return theme.colors.danger;
    default:
      return theme.colors.main;
  }
};

const Wrapper = styled.div`
  width: 80%;
  margin: 1em auto 0;
  padding: 0.75em 1em;
  border-radius: 10px;
  background-color: ${props => props.theme.colors.background};
  font-size: 1.2em;
  line-height: 1.3;
`;

const Summary = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5em;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;

const StatusIcon = styled(MaterialIcon)<{ $accent: string }>`
  color: ${props => props.$accent};
`;

const Label = styled.span<{ $accent: string }>`
  font-weight: bold;
  flex: 1;
  color: ${props => props.$accent};
`;

const Body = styled.div`
  margin-top: 0.35em;
  padding-left: 1.75em;
  font-size: 0.85em;
`;

const Timestamp = styled.div`
  margin-top: 0.35em;
  font-size: 0.85em;
  font-style: italic;
  opacity: 0.8;
`;

const AerodromeStatusBanner = (props: any) => {
  const {t} = useTranslation();
  const theme = useTheme();
  const {status, enabled, watchCurrentAerodromeStatus} = props;

  // null = follow the status severity; a boolean is the user's explicit choice.
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);

  useEffect(() => {
    watchCurrentAerodromeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (enabled !== true || status === undefined || status === null) {
    return null;
  }

  const accent = accentFor(status.status, theme);

  // Expand by default when the aerodrome is not open, so restrictions and
  // closures are immediately visible; collapse the reassuring "open" state.
  // Derived from the current status (which loads asynchronously) so the default
  // is correct even though the banner mounts before the status arrives.
  const expanded = expandedOverride !== null ? expandedOverride : status.status !== 'open';

  return (
    <Wrapper
      role="status"
      aria-label={t('admin.aerodromeStatus')}
    >
      <Summary
        type="button"
        onClick={() => setExpandedOverride(!expanded)}
        aria-expanded={expanded}
      >
        <StatusIcon icon={icons[status.status] || 'info'} $accent={accent}/>
        <Label $accent={accent}>{getLabel(status.status)}</Label>
        <MaterialIcon icon={expanded ? 'expand_less' : 'expand_more'}/>
      </Summary>
      {expanded && (
        <Body>
          {status.details && <div>{newLineToBr(status.details)}</div>}
          {status.timestamp && <Timestamp>{dates.formatDateTime(status.timestamp)}</Timestamp>}
        </Body>
      )}
    </Wrapper>
  );
};

(AerodromeStatusBanner as any).propTypes = {
  status: PropTypes.shape({
    status: PropTypes.string.isRequired,
    details: PropTypes.string,
    timestamp: PropTypes.number,
  }),
  enabled: PropTypes.bool,
  watchCurrentAerodromeStatus: PropTypes.func.isRequired,
};

export default AerodromeStatusBanner;
