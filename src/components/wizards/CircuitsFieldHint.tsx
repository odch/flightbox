import React from 'react';
import FieldHint, {Strong} from './FieldHint';
import { useTranslation } from 'react-i18next';

const CircuitsFieldHint = () => {
  const { t } = useTranslation();
  return (
    <FieldHint caption={t('wizard.circuitsHint.caption')}>
      <div>{t('wizard.circuitsHint.messagePart1')} <Strong>{t('wizard.circuitsHint.messagePart2')}</Strong> {t('wizard.circuitsHint.messagePart3')}</div>
    </FieldHint>
  );
};

export default CircuitsFieldHint;
