import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import JumpNavigation from '../JumpNavigation';
import H1 from '../H1';
import Button from '../Button';
import MaterialIcon from '../MaterialIcon';
import DeleteDialog from '../DeleteDialog';
import PprStatusBadge from '../PprStatusBadge';
import PprAnswer from '../PprAnswer';
import dates from '../../util/dates';
import type { PprRequestStatus } from '../../modules/ppr/actions';
import type { PprStatusNotice } from '../../modules/ppr/reducer';

const Content = styled.div`
  padding: 2em;
`;

const Notice = styled.div`
  margin-bottom: 1.5em;
  padding: 0.75em 1em;
  border-left: 3px solid ${props => props.theme.colors.main};
  background-color: ${props => props.theme.colors.background};
`;

const ErrorNotice = styled.div`
  margin-bottom: 1.5em;
  color: #dc3545;
`;

const DetailList = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: baseline;
  gap: 0.6em 1.5em;
  margin: 0 0 1.5em;

  dt {
    color: #666;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;

    dd {
      margin-bottom: 0.8em;
    }
  }
`;

const Hint = styled.p`
  margin-bottom: 1.5em;
  line-height: 1.4;
`;

// After a withdrawal, for a corrected request; also where the link leads
// nowhere (any more)
const NewRequestLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-top: 1.5em;
  color: ${props => props.theme.colors.main};
`;

// The icon font's ligature is a word: not for screen readers
const LinkIcon = styled.span`
  display: flex;
`;

const NOTICES: Record<PprStatusNotice, { text: string; failure?: boolean }> = {
  withdrawn: { text: 'ppr.statusPage.withdrawn' },
  notFound: { text: 'ppr.statusPage.notFound' },
  answeredMeanwhile: { text: 'ppr.statusPage.answeredMeanwhile' },
  loadFailed: { text: 'ppr.statusPage.loadFailed', failure: true },
  withdrawFailed: { text: 'ppr.statusPage.withdrawFailed', failure: true },
};

interface PprStatusPageProps {
  request: PprRequestStatus | null;
  loading: boolean;
  withdrawing: boolean;
  notice: PprStatusNotice | null;
  // Nobody is logged in: the pages behind the login would show the login
  visitor: boolean;
  // May make a new PPR request: not e.g. a guest session where requests
  // without login are off
  canRequest: boolean;
  loadPprStatus: (key: string, token: string) => void;
  withdrawPprRequest: (key: string, token: string) => void;
  resetPprStatus: () => void;
}

// The page of the status link in the pilot's emails
// (#/ppr/status/<key>/<token>): whoever holds the link sees the request
// without personal data, and can withdraw it while it is pending
const PprStatusPage = (props: PprStatusPageProps) => {
  const { t } = useTranslation();
  const { key = '', token = '' } = useParams();
  const [confirming, setConfirming] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const { request, notice, loadPprStatus, resetPprStatus } = props;

  useEffect(() => {
    loadPprStatus(key, token);
    return () => resetPprStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token]);

  // A notice is shown with its text, which live regions don't announce: the
  // focus goes there, so screen readers read it and keyboard users go on
  // from there (the confirmation dialog and the withdraw button are gone),
  // unless it was moved elsewhere in the meantime
  useEffect(() => {
    if (notice && (!document.activeElement || document.activeElement === document.body)) {
      noticeRef.current?.focus();
    }
  }, [notice]);

  const withdraw = () => {
    setConfirming(false);
    props.withdrawPprRequest(key, token);
  };

  const renderNotice = () => {
    if (!notice) {
      return null;
    }
    const { text, failure } = NOTICES[notice];
    return failure
      ? <ErrorNotice ref={noticeRef} role="alert" tabIndex={-1} data-cy="ppr-status-notice">{t(text)}</ErrorNotice>
      : <Notice ref={noticeRef} role="status" tabIndex={-1} data-cy="ppr-status-notice">{t(text)}</Notice>;
  };

  const renderRequest = (req: PprRequestStatus) => (
    <div data-cy="ppr-status-request">
      <DetailList>
        <dt>{t('movement.details.immatriculation')}</dt>
        <dd>{req.immatriculation}</dd>
        <dt>{t('ppr.plannedDate')}</dt>
        <dd>{dates.formatDate(req.plannedDate)}</dd>
        <dt>{t('ppr.plannedTime')}</dt>
        <dd>{req.plannedTime}</dd>
        <dt>{t('movement.details.flightType')}</dt>
        <dd>{t(`flightTypes.${req.flightType}`)}</dd>
        <dt>{t('common.status')}</dt>
        <dd><PprStatusBadge status={req.status}/></dd>
      </DetailList>
      {req.status !== 'pending' && req.reviewRemarks && (
        <PprAnswer
          status={req.status}
          remarks={req.reviewRemarks}
          automatic={req.automatic}
          dataCy="ppr-status-answer"
        />
      )}
      {req.status === 'approved' && <Hint>{t('ppr.checkBeforeFlight')}</Hint>}
      {req.status === 'pending' && <Hint>{t('ppr.statusPage.pendingHint')}</Hint>}
      {req.canWithdraw && (
        <Button
          type="button"
          icon="undo"
          label={t('ppr.statusPage.withdraw')}
          onClick={() => setConfirming(true)}
          disabled={props.withdrawing}
          loading={props.withdrawing}
          flat
          danger
          dataCy="ppr-withdraw"
        />
      )}
    </div>
  );

  // For visitors the logo leads to the PPR request, i.e. its login
  return (
    <VerticalHeaderLayout homePath={props.visitor ? '/ppr/new' : undefined}>
      <Content>
        {!props.visitor && <JumpNavigation/>}
        {/* The side header with the aerodrome's name is hidden on phones */}
        <H1>{t('ppr.requestFor', { aerodrome: __CONF__.aerodrome.name })}</H1>
        {renderNotice()}
        {props.loading && (
          <p><MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}</p>
        )}
        {request && renderRequest(request)}
        {props.canRequest && !props.loading && (
          <div>
            <NewRequestLink to="/ppr/new" data-cy="ppr-status-new-request">
              <LinkIcon aria-hidden="true"><MaterialIcon icon="add" size={18}/></LinkIcon>
              {t('ppr.newRequest')}
            </NewRequestLink>
          </div>
        )}
        {confirming && (
          <DeleteDialog
            question={t('ppr.statusPage.withdrawConfirm')}
            confirmLabel={t('ppr.statusPage.withdraw')}
            confirmIcon="undo"
            onConfirm={withdraw}
            onCancel={() => setConfirming(false)}
          />
        )}
      </Content>
    </VerticalHeaderLayout>
  );
};

export default PprStatusPage;
