import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import MaterialIcon from '../../MaterialIcon';
import ModalDialog from '../../ModalDialog';
import Button from '../../Button';
import dates from '../../../util/dates';
import type { Passkey } from '../../../modules/auth';

const Item = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  padding: 0.75em 1em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-weight: bold;
  margin-bottom: 0.35em;
`;

const Meta = styled.div`
  font-size: 0.85em;
  color: #666;
  line-height: 1.5;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
  font-family: inherit;

  &:hover {
    color: ${props => props.theme.colors.danger};
  }
`;

const Question = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const Data = styled.div`
  margin-bottom: 1em;
`;

const DataItem = styled.div`
  margin-bottom: 0.3em;
`;

const DialogButton = styled(Button)`
  @media(max-width: 600px) {
    width: 100%;
  }
`;

const DeleteButton = styled(DialogButton)`
  float: right;

  @media(max-width: 600px) {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

const formatDate = (timestamp: number) => {
  return dates.formatDate(new Date(timestamp).toISOString());
};

interface Props {
  passkey: Passkey;
  onRemove: (credentialId: string) => void;
}

const PasskeyListItem: React.FC<Props> = ({ passkey, onRemove }) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = () => {
    setConfirming(false);
    onRemove(passkey.credentialId);
  };

  const confirmContent = (
    <div>
      <Question>{t('profile.passkeysRemoveConfirm')}</Question>
      <Data>
        <DataItem>{t('profile.passkeysRemoveDevice')} {passkey.deviceName}</DataItem>
        <DataItem>{t('profile.passkeysCreatedAt', { date: formatDate(passkey.createdAt) })}</DataItem>
      </Data>
      <div>
        <DeleteButton
          label={t('profile.passkeysRemove')}
          icon="delete"
          onClick={handleConfirm}
          danger
          dataCy="remove-passkey-confirm"
        />
        <DialogButton
          label={t('common.cancel')}
          onClick={() => setConfirming(false)}
          neutral
        />
      </div>
    </div>
  );

  return (
    <>
      <Item data-cy={`passkey-${passkey.credentialId}`}>
        <Info>
          <Name>{passkey.deviceName}</Name>
          <Meta>{t('profile.passkeysCreatedAt', { date: formatDate(passkey.createdAt) })}</Meta>
          <Meta>
            {passkey.lastUsedAt
              ? t('profile.passkeysLastUsed', { date: formatDate(passkey.lastUsedAt) })
              : t('profile.passkeysLastUsedNever')}
          </Meta>
        </Info>
        <IconButton
          type="button"
          onClick={() => setConfirming(true)}
          title={t('profile.passkeysRemove')}
          data-cy="remove-passkey"
        >
          <MaterialIcon icon="delete"/>
        </IconButton>
      </Item>
      {confirming && (
        <ModalDialog content={confirmContent} onBlur={() => setConfirming(false)}/>
      )}
    </>
  );
};

export default PasskeyListItem;
