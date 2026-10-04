import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import LabeledBox from '../LabeledBox';
import Button from '../Button';
import DescriptionText from '../AdminPage/DescriptionText';
import ApiKeyList from './ApiKeyList';
import CreateApiKeyForm from './CreateApiKeyForm';
import ApiKeySecretDialog from './ApiKeySecretDialog';
import UsageHint from './UsageHint';
import {ApiKey, CreateApiKeyCallback, CreateApiKeyPayload} from '../../modules/apiKeys';

const Paragraph = styled.p`
  margin: 0 0 0.75em 0;
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
`;

export interface ApiAccessProps {
  keys: ApiKey[] | undefined;
  availableScopes: string[];
  loadError: string | null;
  creating: boolean;
  createError: string | null;
  revoking: string[];
  revokeError: string | null;
  loadApiKeys: () => void;
  createApiKey: (payload: CreateApiKeyPayload, onCreated: CreateApiKeyCallback) => void;
  revokeApiKey: (id: string) => void;
}

const ApiAccess = (props: ApiAccessProps) => {
  const {t} = useTranslation();
  // The plaintext key of a newly created key. It lives here only (never in
  // the Redux store) and is dropped when the dialog is closed.
  const [newKey, setNewKey] = useState<string | null>(null);
  // A key created after the page was left (e.g. another admin tab chosen
  // while the request ran) cannot be shown; the saga then revokes it.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const showNewKey = (key: string) => {
    if (!mounted.current) {
      return false;
    }
    setNewKey(key);
    return true;
  };

  const renderKeys = () => {
    if (props.loadError) {
      return (
        <>
          <ErrorText role="alert">
            {t(props.loadError === 'forbidden' ? 'apiAccess.forbidden' : 'apiAccess.loadFailed')}
          </ErrorText>
          <Button label={t('apiAccess.retry')} icon="refresh" onClick={props.loadApiKeys} neutral/>
        </>
      );
    }
    if (props.keys === undefined) {
      return <p>{t('apiAccess.loading')}</p>;
    }
    return (
      <ApiKeyList
        keys={props.keys}
        revoking={props.revoking}
        revokeError={props.revokeError}
        onRevoke={props.revokeApiKey}
      />
    );
  };

  const canCreate = !props.loadError && props.keys !== undefined && props.availableScopes.length > 0;

  return (
    <>
      <LabeledBox label={t('apiAccess.keysTitle')}>
        <DescriptionText>
          <Paragraph>{t('apiAccess.description')}</Paragraph>
          <Paragraph><strong>{t('apiAccess.descriptionOnce')}</strong></Paragraph>
        </DescriptionText>
        {renderKeys()}
      </LabeledBox>
      {canCreate && (
        <LabeledBox label={t('apiAccess.create.title')}>
          <CreateApiKeyForm
            availableScopes={props.availableScopes}
            creating={props.creating}
            createError={props.createError}
            onCreate={props.createApiKey}
            onKeyCreated={showNewKey}
          />
        </LabeledBox>
      )}
      <LabeledBox label={t('apiAccess.usage.title')}>
        <UsageHint/>
      </LabeledBox>
      {newKey !== null && (
        <ApiKeySecretDialog apiKey={newKey} onClose={() => setNewKey(null)}/>
      )}
    </>
  );
};

export default ApiAccess;
