import React, { useEffect, useId, useRef, useState } from 'react';
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
      case 'revoked': return '#6c757d';
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

// Tells what became of the request of a link in the notification email
const LinkNotice = styled.div`
  padding: 0.75em 1em;
  border-left: 3px solid ${props => props.theme.colors.main};
`;

const MissingNotice = styled(LinkNotice)`
  margin: 1em;
  background-color: ${props => props.theme.colors.background};
`;

// In the details, on the background of the opened row
const AnsweredNotice = styled(LinkNotice)`
  margin-bottom: 1em;
  background-color: #fff;
`;

// What the link found, captured when it was handled: the admin's own
// answer afterwards doesn't make the request "already answered"
interface LinkResult {
  key: string;
  missing: boolean;
  answered: boolean;
}

const PprRequestList = (props: any) => {
  const { t } = useTranslation();
  const { linkedKey, loading, loaded, loadFailed, settingsReady, data } = props;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);
  // Whether a load has started since the list was opened: until one has
  // succeeded, the store can hold the requests of an earlier visit
  const loadStarted = useRef(false);
  const handledKey = useRef<string | null>(null);
  const linkedRow = useRef<HTMLDivElement>(null);
  const linkedToggle = useRef<HTMLButtonElement>(null);
  const missingNotice = useRef<HTMLDivElement>(null);
  const answeredNoticeId = useId();

  useEffect(() => {
    props.loadPprRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opens the request of a link in the notification email
  // (#/admin?tab=ppr&request=<key>), ready to be answered: the link itself
  // never answers it. Once per key, after a successful load since the list
  // was opened (a failed one leaves the requests of an earlier visit, and
  // the link to the next load), with all requests and the settings above
  // the list (they would push the row away after the scroll). The key stays
  // in the URL: a replace navigation would scroll the app to the top.
  useEffect(() => {
    if (loading) {
      loadStarted.current = true;
      return;
    }
    if (!linkedKey || handledKey.current === linkedKey
      || !loadStarted.current || loadFailed || !loaded || !settingsReady) {
      return;
    }
    handledKey.current = linkedKey;
    const request = (data || []).find((req: any) => req && req.key === linkedKey);
    if (request) {
      setExpandedKey(request.key);
      // Remarks belong to the request they were typed for
      setReviewRemarks('');
    }
    setLinkResult({
      key: linkedKey,
      // Deleted by the pilot, or after the retention period
      missing: !request,
      answered: !!request && request.status !== 'pending',
    });
  }, [linkedKey, loading, loaded, loadFailed, settingsReady, data]);

  // Scrolls to the opened request, or to the notice that it is missing,
  // once it is shown. The focus goes there too, so keyboard and screen
  // reader users go on from there (the notices are shown with their text,
  // which live regions don't announce), unless it was moved elsewhere in
  // the meantime.
  useEffect(() => {
    if (!linkResult) {
      return;
    }
    const target = linkResult.missing ? missingNotice.current : linkedRow.current;
    // Not in every environment (e.g. jsdom)
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start' });
    }
    const focusTarget = linkResult.missing ? missingNotice.current : linkedToggle.current;
    if (!document.activeElement || document.activeElement === document.body) {
      focusTarget?.focus({ preventScroll: true });
    }
  }, [linkResult]);

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

  // E.g. when a closure comes up after the approval; the pilot gets the
  // reason by email
  const handleRevoke = (key: string) => {
    props.revokePprApproval(key, reviewRemarks.trim());
    setReviewRemarks('');
    setExpandedKey(null);
  };

  if (loading) {
    return (
      <Message>
        <MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}
      </Message>
    );
  }

  const requests = data || [];

  return (
    <div>
      {loadFailed && (
        <ErrorMessage role="alert" data-cy="ppr-load-failed">{t('ppr.loadFailed')}</ErrorMessage>
      )}

      {linkResult && linkResult.missing && (
        <MissingNotice ref={missingNotice} role="status" tabIndex={-1} data-cy="ppr-linked-request-missing">
          {t('ppr.linkedRequestMissing')}
        </MissingNotice>
      )}

      {props.reviewFailed && (
        <ErrorMessage>{t('ppr.reviewFailed')}</ErrorMessage>
      )}

      {props.revokeFailed && (
        <ErrorMessage>{t('ppr.revokeFailed')}</ErrorMessage>
      )}

      {requests.length === 0 && !loadFailed && (
        <EmptyMessage>{t('ppr.noRequests')}</EmptyMessage>
      )}

      {requests.map((req: any) => {
        const expanded = expandedKey === req.key;
        const automatic = req.reviewedBy === 'automatic';
        const linked = linkResult && linkResult.key === req.key ? linkResult : null;
        const answeredNotice = !!linked && linked.answered && expanded;
        return (
          <Row
            key={req.key}
            ref={linked ? linkedRow : undefined}
            $expanded={expanded}
            data-cy={`ppr-admin-${req.key}`}
          >
            <RowHeader
              ref={linked ? linkedToggle : undefined}
              type="button"
              onClick={() => toggleExpanded(req.key)}
              aria-expanded={expanded}
              aria-describedby={answeredNotice ? answeredNoticeId : undefined}
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
                {answeredNotice && (
                  <AnsweredNotice id={answeredNoticeId} role="status" data-cy="ppr-linked-request-answered">
                    {t('ppr.linkedRequestAnswered')}
                  </AnsweredNotice>
                )}
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
                  {automatic && (<>
                    <dt>{t('ppr.answered')}</dt>
                    <dd data-cy="ppr-answered-automatically">{t('ppr.answeredAutomatically')}</dd>
                  </>)}
                  {req.reviewRemarks && (<>
                    <dt>{t(automatic && req.status === 'approved' ? 'ppr.pilotInfo' : 'ppr.adminRemarks')}</dt>
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

                {req.status === 'approved' && (
                  <ReviewSection>
                    <RemarksInput
                      placeholder={t('ppr.revokeReason')}
                      aria-label={t('ppr.revokeReason')}
                      value={reviewRemarks}
                      onChange={e => setReviewRemarks(e.target.value)}
                      data-cy="ppr-revoke-reason"
                    />
                    <ReviewButtons>
                      <Button
                        type="button"
                        icon="block"
                        label={t('ppr.revoke')}
                        onClick={() => handleRevoke(req.key)}
                        disabled={!reviewRemarks.trim()}
                        danger
                        dataCy="ppr-revoke"
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
