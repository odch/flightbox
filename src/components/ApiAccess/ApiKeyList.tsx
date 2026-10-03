import React, {useState} from 'react';
import styled, {css} from 'styled-components';
import {useTranslation} from 'react-i18next';
import Button from '../Button';
import DeleteDialog from '../DeleteDialog';
import {ApiKey} from '../../modules/apiKeys';
import {scopeLabel} from './scopes';
import {expiryStatus, ExpiryStatus, formatDate, formatDateTime} from './format';

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    text-align: left;
    vertical-align: top;
    padding: 0.6em 0.75em 0.6em 0;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: bold;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const Name = styled.td`
  font-weight: bold;
  word-break: break-word;
`;

const ScopeList = styled.ul`
  margin: 0;
  padding: 0 0 0 1.2em;
  max-width: 25em;
`;

const Secondary = styled.div`
  color: #666;
  font-size: 0.9em;
  word-break: break-all;
`;

const Expiry = styled.td<{ $status: ExpiryStatus }>`
  white-space: nowrap;

  ${props => props.$status === 'expired' && css`
    color: ${props.theme.colors.danger};
    font-weight: bold;
  `}

  ${props => props.$status === 'expiresSoon' && css`
    color: #b35c00;
    font-weight: bold;
  `}
`;

const NoWrap = styled.td`
  white-space: nowrap;
`;

const NoWrapText = styled.div`
  white-space: nowrap;
`;

const Empty = styled.p`
  font-style: italic;
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
`;

interface ApiKeyListProps {
  keys: ApiKey[];
  revoking: string[];
  revokeError: string | null;
  onRevoke: (id: string) => void;
  // Current time in ms, for the expiry highlight (defaults to Date.now()).
  now?: number;
}

const ApiKeyList = ({keys, revoking, revokeError, onRevoke, now}: ApiKeyListProps) => {
  const {t} = useTranslation();
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const currentTime = typeof now === 'number' ? now : Date.now();

  const confirmRevoke = () => {
    if (keyToRevoke) {
      onRevoke(keyToRevoke.id);
    }
    setKeyToRevoke(null);
  };

  return (
    <>
      {revokeError && (
        <ErrorText role="alert">
          {t(revokeError === 'forbidden' ? 'apiAccess.forbidden' : 'apiAccess.revokeFailed')}
        </ErrorText>
      )}
      {keys.length === 0 ? (
        <Empty>{t('apiAccess.empty')}</Empty>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>{t('apiAccess.name')}</th>
                <th>{t('apiAccess.scopes')}</th>
                <th>{t('apiAccess.created')}</th>
                <th>{t('apiAccess.expires')}</th>
                <th>{t('apiAccess.lastUsed')}</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {keys.map(apiKey => {
                const status = expiryStatus(apiKey.expiresAt, currentTime);
                return (
                  <tr key={apiKey.id} data-testid={`api-key-${apiKey.id}`}>
                    <Name>{apiKey.name}</Name>
                    <td>
                      <ScopeList>
                        {apiKey.scopes.map(scope => (
                          <li key={scope}>{scopeLabel(t, scope)}</li>
                        ))}
                      </ScopeList>
                    </td>
                    <td>
                      <NoWrapText>{formatDate(apiKey.createdAt)}</NoWrapText>
                      {apiKey.createdBy && (
                        <Secondary>{t('apiAccess.createdBy', {email: apiKey.createdBy})}</Secondary>
                      )}
                    </td>
                    <Expiry $status={status} data-expiry={status}>
                      {apiKey.expiresAt === null
                        ? t('apiAccess.unlimited')
                        : formatDate(apiKey.expiresAt)}
                      {status === 'expired' && <Secondary>{t('apiAccess.expired')}</Secondary>}
                      {status === 'expiresSoon' && <Secondary>{t('apiAccess.expiresSoon')}</Secondary>}
                    </Expiry>
                    <NoWrap>
                      {apiKey.lastUsedAt === null
                        ? t('apiAccess.never')
                        : formatDateTime(apiKey.lastUsedAt)}
                    </NoWrap>
                    <NoWrap>
                      <Button
                        label={t('apiAccess.revoke')}
                        icon="block"
                        flat
                        danger
                        disabled={revoking.includes(apiKey.id)}
                        loading={revoking.includes(apiKey.id)}
                        onClick={() => setKeyToRevoke(apiKey)}
                        dataCy={`revoke-${apiKey.id}`}
                      />
                    </NoWrap>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrapper>
      )}
      {keyToRevoke && (
        <DeleteDialog
          question={t('apiAccess.revokeConfirm', {name: keyToRevoke.name})}
          confirmLabel={t('apiAccess.revoke')}
          confirmIcon="block"
          onConfirm={confirmRevoke}
          onCancel={() => setKeyToRevoke(null)}
        />
      )}
    </>
  );
};

export default ApiKeyList;
