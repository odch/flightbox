import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Box = styled.div<{ $approved: boolean }>`
  margin-bottom: 1em;
  padding: 0.5em 0.75em;
  background-color: #f8f9fa;
  border-left: 3px solid ${props => props.$approved ? '#28a745' : '#dc3545'};
  text-align: left;
  line-height: 1.4;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

const Label = styled.div`
  margin-bottom: 0.25em;
  color: #666;
  font-size: 0.9em;
`;

interface PprAnswerProps {
  status: string;
  remarks: string;
  // Answered automatically, as on submission; else by an admin
  automatic?: boolean;
  dataCy?: string;
}

// The aerodrome's answer to a pilot: the information for pilots of an
// automatic approval or the remark of an admin's, or the reason of a
// rejection or a revocation. Labelled as in the emails.
const PprAnswer = ({ status, remarks, automatic = true, dataCy }: PprAnswerProps) => {
  const { t } = useTranslation();
  const approved = status === 'approved';
  let label = 'ppr.reason';
  if (approved) {
    label = automatic ? 'ppr.pilotInfo' : 'ppr.approvalRemarks';
  }
  return (
    <Box $approved={approved} data-cy={dataCy}>
      <Label>{t(label)}</Label>
      {remarks}
    </Box>
  );
};

export default PprAnswer;
