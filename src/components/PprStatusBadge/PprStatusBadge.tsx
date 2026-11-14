import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const COLORS: Record<string, { text: string; background: string }> = {
  pending: { text: '#333', background: '#ffc107' },
  approved: { text: 'white', background: '#28a745' },
  rejected: { text: 'white', background: '#dc3545' },
  revoked: { text: 'white', background: '#6c757d' },
};

const colorsOf = (status: string) => COLORS[status] || COLORS.pending;

// The app font (Istok Web) sits high in its line box: with the same padding
// above and below, the capitals touched the top. More padding above puts
// them in the middle of the tag.
const Badge = styled.span<{ $status: string }>`
  display: inline-block;
  flex-shrink: 0;
  padding: 0.35em 0.8em 0.1em;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  color: ${props => colorsOf(props.$status).text};
  background-color: ${props => colorsOf(props.$status).background};
`;

interface PprStatusBadgeProps {
  status: string;
}

// The status of a PPR request, in the pilot's and in the admin list
const PprStatusBadge = ({ status }: PprStatusBadgeProps) => {
  const { t } = useTranslation();
  return <Badge $status={status}>{t(`ppr.status.${status}`)}</Badge>;
};

export default PprStatusBadge;
