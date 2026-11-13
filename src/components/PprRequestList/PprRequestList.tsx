import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import Button from '../Button';
import dates from '../../util/dates';

// Rows like the other admin lists (messages): the box has no padding, rows
// are separated by lines and highlighted when hovered or opened.
const Row = styled.div<{ $expanded?: boolean }>`
  border-top: 1px solid #eee;

  &:first-child {
    border-top: none;
  }

  ${props => props.$expanded && `background-color: ${props.theme.colors.background};`}
`;

const RowHeader = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 0.5em 1em;
  width: 100%;
  padding: 1em;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

const Summary = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.75em;
`;

const Aircraft = styled.span`
  font-weight: 600;
  font-size: 1.1em;
`;

const When = styled.span`
  color: #666;
`;

const Pilot = styled.div`
  margin-top: 0.25em;
  color: #666;
  font-size: 0.9em;
  overflow-wrap: anywhere;
`;

const StatusBadge = styled.span<{ $status: string }>`
  flex-shrink: 0;
  padding: 0.2em 0.8em;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
  color: ${props => props.$status === 'pending' ? '#333' : 'white'};
  background-color: ${props => {
    switch (props.$status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#ffc107';
    }
  }};
`;

const Details = styled.div`
  padding: 0 1em 1em;
`;

const DetailList = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.4em 1.5em;
  margin: 0;
  font-size: 0.9em;

  dt {
    color: #666;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    dd {
      margin-bottom: 0.6em;
    }
  }
`;

const ReviewSection = styled.div`
  margin-top: 1em;
  padding-top: 1em;
  border-top: 1px solid #ddd;
`;

const RemarksInput = styled.textarea`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 60px;
  padding: 0.5em;
  margin-bottom: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9em;
  resize: vertical;
`;

const ReviewButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5em;

  @media (max-width: 768px) {
    > * {
      flex: 1 1 auto;
    }
  }
`;

const Message = styled.div`
  padding: 1em;
`;

const EmptyMessage = styled(Message)`
  color: #666;
  font-style: italic;
`;

const ErrorMessage = styled(Message)`
  color: #dc3545;
`;

const PprRequestList = (props: any) => {
  const { t } = useTranslation();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  useEffect(() => {
    props.loadPprRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpanded = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
    // Remarks belong to the request they were typed for
    setReviewRemarks('');
  };

  const handleReview = (key: string, status: string) => {
    props.reviewPprRequest(key, status, reviewRemarks || undefined);
    setReviewRemarks('');
    setExpandedKey(null);
  };

  if (props.loading) {
    return (
      <Message>
        <MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}
      </Message>
    );
  }

  const requests = props.data || [];

  return (
    <div>
      {props.reviewFailed && (
        <ErrorMessage>{t('ppr.reviewFailed')}</ErrorMessage>
      )}

      {requests.length === 0 && (
        <EmptyMessage>{t('ppr.noRequests')}</EmptyMessage>
      )}

      {requests.map((req: any) => {
        const expanded = expandedKey === req.key;
        return (
          <Row key={req.key} $expanded={expanded} data-cy={`ppr-admin-${req.key}`}>
            <RowHeader
              type="button"
              onClick={() => toggleExpanded(req.key)}
              aria-expanded={expanded}
              data-cy="ppr-admin-toggle"
            >
              <Summary>
                <Title>
                  <Aircraft>{req.immatriculation}</Aircraft>
                  <When>{dates.formatDate(req.plannedDate)} {req.plannedTime}</When>
                </Title>
                <Pilot>
                  {req.firstname} {req.lastname} · {t(`flightTypes.${req.flightType}`)}
                </Pilot>
              </Summary>
              <StatusBadge $status={req.status}>
                {t(`ppr.status.${req.status}`)}
              </StatusBadge>
            </RowHeader>

            {expanded && (
              <Details>
                <DetailList>
                  <dt>{t('movement.details.email')}</dt>
                  <dd><a href={`mailto:${req.email}`}>{req.email}</a></dd>
                  {req.phone && (<>
                    <dt>{t('movement.details.phone')}</dt>
                    <dd><a href={`tel:${req.phone}`}>{req.phone}</a></dd>
                  </>)}
                  <dt>{t('movement.details.aircraftType')}</dt>
                  <dd>{req.aircraftType || '-'}</dd>
                  <dt>{t('movement.details.mtow')}</dt>
                  <dd>{req.mtow ? `${req.mtow} kg` : '-'}</dd>
                  {req.remarks && (<>
                    <dt>{t('common.remarks')}</dt>
                    <dd>{req.remarks}</dd>
                  </>)}
                  {req.reviewRemarks && (<>
                    <dt>{t('ppr.adminRemarks')}</dt>
                    <dd>{req.reviewRemarks}</dd>
                  </>)}
                </DetailList>

                {req.status === 'pending' && (
                  <ReviewSection>
                    <RemarksInput
                      placeholder={t('ppr.adminRemarks')}
                      aria-label={t('ppr.adminRemarks')}
                      value={reviewRemarks}
                      onChange={e => setReviewRemarks(e.target.value)}
                      data-cy="ppr-review-remarks"
                    />
                    <ReviewButtons>
                      <Button
                        type="button"
                        icon="close"
                        label={t('ppr.reject')}
                        onClick={() => handleReview(req.key, 'rejected')}
                        danger
                        dataCy="ppr-reject"
                      />
                      <Button
                        type="button"
                        icon="check"
                        label={t('ppr.approve')}
                        onClick={() => handleReview(req.key, 'approved')}
                        primary
                        dataCy="ppr-approve"
                      />
                    </ReviewButtons>
                  </ReviewSection>
                )}
              </Details>
            )}
          </Row>
        );
      })}
    </div>
  );
};

export default PprRequestList;
