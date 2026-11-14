import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import JumpNavigation from '../JumpNavigation';
import MaterialIcon from '../MaterialIcon';
import ModalDialog from '../ModalDialog';
import H1 from '../H1';
import Button from '../Button';
import PprStatusBadge from '../PprStatusBadge';
import PprRequestGroups from '../PprRequestGroups';
import dates from '../../util/dates';

const Content = styled.div`
  padding: 2em;
`;

const RequestCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1em;
  margin-bottom: 1em;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
`;

const Aircraft = styled.span`
  font-weight: 600;
  font-size: 1.1em;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 2em;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 0.3em;
`;

const ReviewRemarks = styled.div<{ $status: string }>`
  margin-top: 0.5em;
  padding: 0.5em;
  background-color: #f8f9fa;
  border-left: 3px solid ${props => props.$status === 'approved' ? '#28a745' : '#dc3545'};
  font-size: 0.9em;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  margin-top: 0.5em;
`;

const EmptyMessage = styled.div`
  color: #666;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-bottom: 1em;
`;

const ConfirmDialogContent = styled.div``;

const ConfirmHeading = styled.div`
  font-size: 1.2em;
  margin-bottom: 1em;
`;

const ConfirmButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5em;
`;

const PprStatusList = (props: any) => {
  const { t } = useTranslation();
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

  useEffect(() => {
    props.loadPprRequests();
  }, []);

  const handleDelete = (key: string) => {
    setDeleteConfirmKey(null);
    props.deletePprRequest(key);
  };

  if (props.loading) {
    return (
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <H1>{t('ppr.myRequests')}</H1>
          <MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}
        </Content>
      </VerticalHeaderLayout>
    );
  }

  const requests = props.data || [];

  return (
    <VerticalHeaderLayout>
      <Content>
        <JumpNavigation/>
        <H1>{t('ppr.myRequests')}</H1>

        {props.deleteFailed && (
          <ErrorMessage>{t('ppr.deleteFailed')}</ErrorMessage>
        )}

        {requests.length === 0 && (
          <EmptyMessage>{t('ppr.noRequests')}</EmptyMessage>
        )}

        <PprRequestGroups
          requests={requests}
          headingLevel="h2"
          renderRequest={(req: any) => (
            <RequestCard key={req.key} data-cy={`ppr-request-${req.key}`}>
              <RequestHeader>
                <Aircraft>{req.immatriculation}</Aircraft>
                <PprStatusBadge status={req.status}/>
              </RequestHeader>
              <DetailRow>
                <span>{dates.formatDate(req.plannedDate)}</span>
                <span>{req.plannedTime}</span>
                <span>{t(`flightTypes.${req.flightType}`)}</span>
              </DetailRow>
              <DetailRow>
                <span>{req.firstname} {req.lastname}</span>
              </DetailRow>
              {req.status !== 'pending' && req.reviewRemarks && (
                <ReviewRemarks $status={req.status}>{req.reviewRemarks}</ReviewRemarks>
              )}
              {req.status === 'pending' && (
                <Actions>
                  <Button
                    type="button"
                    icon="delete"
                    label={t('common.delete')}
                    onClick={() => setDeleteConfirmKey(req.key)}
                    flat
                    danger
                    dataCy={`ppr-delete-${req.key}`}
                  />
                </Actions>
              )}
            </RequestCard>
          )}
        />

        {deleteConfirmKey && (
          <ModalDialog content={
            <ConfirmDialogContent>
              <ConfirmHeading>{t('ppr.deleteConfirm')}</ConfirmHeading>
              <ConfirmButtons>
                <Button
                  type="button"
                  label={t('common.cancel')}
                  onClick={() => setDeleteConfirmKey(null)}
                  flat
                />
                <Button
                  type="button"
                  icon="delete"
                  label={t('common.delete')}
                  onClick={() => handleDelete(deleteConfirmKey)}
                  danger
                  dataCy="ppr-delete-confirm"
                />
              </ConfirmButtons>
            </ConfirmDialogContent>
          }/>
        )}
      </Content>
    </VerticalHeaderLayout>
  );
};

export default PprStatusList;
