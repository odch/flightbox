import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import Button from '../Button';

const RequestCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1em;
  margin-bottom: 0.5em;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const Aircraft = styled.span`
  font-weight: 600;
  font-size: 1.1em;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.2em 0.8em;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  color: white;
  background-color: ${props => {
    switch (props.$status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#ffc107';
    }
  }};
  ${props => props.$status === 'pending' && 'color: #333;'}
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
`;

const DateInfo = styled.span`
  color: #666;
  font-size: 0.9em;
`;

const DetailSection = styled.div`
  margin-top: 1em;
  padding-top: 1em;
  border-top: 1px solid #eee;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 2em;
  margin-bottom: 0.3em;
  font-size: 0.9em;
`;

const DetailLabel = styled.span`
  color: #666;
  min-width: 120px;
`;

const DetailValue = styled.span`
  font-weight: 500;
`;

const ReviewSection = styled.div`
  margin-top: 1em;
  padding-top: 1em;
  border-top: 1px solid #eee;
`;

const RemarksInput = styled.textarea`
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
  gap: 0.5em;
`;

const EmptyMessage = styled.div`
  color: #666;
  font-style: italic;
  padding: 1em;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-bottom: 1em;
`;

const PprRequestList = (props: any) => {
  const { t } = useTranslation();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  useEffect(() => {
    props.loadPprRequests();
  }, []);

  const handleReview = (key: string, status: string) => {
    props.reviewPprRequest(key, status, reviewRemarks || undefined);
    setReviewRemarks('');
    setExpandedKey(null);
  };

  if (props.loading) {
    return (
      <div>
        <MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}
      </div>
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

      {requests.map((req: any) => (
        <RequestCard key={req.key} data-cy={`ppr-admin-${req.key}`}>
          <RequestHeader onClick={() => setExpandedKey(expandedKey === req.key ? null : req.key)}>
            <HeaderInfo>
              <Aircraft>{req.immatriculation}</Aircraft>
              <DateInfo>{req.plannedDate} {req.plannedTime}</DateInfo>
              <span>{req.firstname} {req.lastname}</span>
            </HeaderInfo>
            <StatusBadge $status={req.status}>
              {t(`ppr.status.${req.status}`)}
            </StatusBadge>
          </RequestHeader>

          {expandedKey === req.key && (
            <DetailSection>
              <DetailRow>
                <DetailLabel>{t('movement.details.email')}</DetailLabel>
                <DetailValue>{req.email}</DetailValue>
              </DetailRow>
              {req.phone && (
                <DetailRow>
                  <DetailLabel>{t('movement.details.phone')}</DetailLabel>
                  <DetailValue>{req.phone}</DetailValue>
                </DetailRow>
              )}
              <DetailRow>
                <DetailLabel>{t('movement.details.aircraftType')}</DetailLabel>
                <DetailValue>{req.aircraftType || '-'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>{t('movement.details.mtow')}</DetailLabel>
                <DetailValue>{req.mtow || '-'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>{t('movement.details.flightType')}</DetailLabel>
                <DetailValue>{t(`flightTypes.${req.flightType}`)}</DetailValue>
              </DetailRow>
              {req.remarks && (
                <DetailRow>
                  <DetailLabel>{t('common.remarks')}</DetailLabel>
                  <DetailValue>{req.remarks}</DetailValue>
                </DetailRow>
              )}
              {req.reviewRemarks && (
                <DetailRow>
                  <DetailLabel>{t('ppr.adminRemarks')}</DetailLabel>
                  <DetailValue>{req.reviewRemarks}</DetailValue>
                </DetailRow>
              )}

              {req.status === 'pending' && (
                <ReviewSection>
                  <RemarksInput
                    placeholder={t('ppr.adminRemarks')}
                    value={reviewRemarks}
                    onChange={e => setReviewRemarks(e.target.value)}
                    data-cy="ppr-review-remarks"
                  />
                  <ReviewButtons>
                    <Button
                      type="button"
                      icon="check"
                      label={t('ppr.approve')}
                      onClick={() => handleReview(req.key, 'approved')}
                      primary
                      dataCy="ppr-approve"
                    />
                    <Button
                      type="button"
                      icon="close"
                      label={t('ppr.reject')}
                      onClick={() => handleReview(req.key, 'rejected')}
                      danger
                      dataCy="ppr-reject"
                    />
                  </ReviewButtons>
                </ReviewSection>
              )}
            </DetailSection>
          )}
        </RequestCard>
      ))}
    </div>
  );
};

export default PprRequestList;
