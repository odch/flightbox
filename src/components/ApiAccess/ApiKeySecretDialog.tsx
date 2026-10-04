import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import ModalDialog from '../ModalDialog';
import ClipboardCopier from '../ClipboardCopier';
import Button from '../Button';

const Wrapper = styled.div`
  max-width: 40em;
`;

const Heading = styled.h2`
  margin: 0 0 0.75em 0;
  font-size: 1.4em;
`;

const Warning = styled.p`
  margin: 0 0 1em 0;
  padding: 0.75em;
  border-left: 3px solid ${props => props.theme.colors.danger};
  background-color: #fff8f7;
`;

const KeyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1.5em;
`;

const KeyInput = styled.input`
  flex: 1;
  min-width: 0;
  width: 34em;
  font-family: monospace;
  font-size: 0.95em;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #f7f7f7;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

interface ApiKeySecretDialogProps {
  // The plaintext key, shown this once.
  apiKey: string;
  onClose: () => void;
}

// No onBlur on the modal: a click next to the dialog must not close it and
// lose the key before it has been copied.
const ApiKeySecretDialog = ({apiKey, onClose}: ApiKeySecretDialogProps) => {
  const {t} = useTranslation();
  const content = (
    <Wrapper role="dialog" aria-modal="true" aria-labelledby="api-key-secret-title">
      <Heading id="api-key-secret-title">{t('apiAccess.secret.title')}</Heading>
      <Warning>{t('apiAccess.secret.warning')}</Warning>
      <KeyRow>
        <KeyInput
          type="text"
          readOnly
          value={apiKey}
          aria-label={t('apiAccess.secret.label')}
          autoComplete="off"
          spellCheck={false}
          // Moves the focus into the dialog with the key selected for copying.
          autoFocus
          onFocus={e => e.target.select()}
          data-cy="api-key-secret"
        />
        <ClipboardCopier text={apiKey}/>
      </KeyRow>
      <Actions>
        <Button label={t('apiAccess.secret.close')} onClick={onClose} primary dataCy="api-key-secret-close"/>
      </Actions>
    </Wrapper>
  );

  return <ModalDialog content={content}/>;
};

export default ApiKeySecretDialog;
