import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import objectToArray from "../../../../util/objectToArray"
import ModalDialog from '../../../ModalDialog';
import Heading from './Heading';
import Items from './Items';
import Item from './Item';
import CancelButton from './CancelButton';
import ConfirmButton from './ConfirmButton';

const getReqText = (req: any, lang: string): string => {
  if (typeof req === 'string') return req;
  if (req.de !== undefined) return req[lang] ?? req.de;
  return req.text;
};

const CommitRequirementsDialog = props => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const content = (
    <div>
      <Heading>{t('departure.confirm.heading')}</Heading>
      <Items>
        {(objectToArray(__CONF__.departureCommitRequirements) as any[]).map((req, index) => (
          <Item key={index} styles={typeof req === 'object' ? req.styles : undefined}>
            {getReqText(req, lang)}
          </Item>
        ))}
      </Items>
      <div>
        <ConfirmButton
          label={t('departure.confirm.confirmButton')}
          icon="done_all"
          onClick={props.onConfirm}
          dataCy="commit-requirement-dialog-confirm"
          primary
        />
        <CancelButton label={t('departure.confirm.cancelButton')} onClick={props.onCancel}/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onCancel} fullWidthThreshold={800}/>;
};

CommitRequirementsDialog.propTypes = {
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CommitRequirementsDialog;
