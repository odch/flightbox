import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Dl = styled.dl`
  margin: 1em 0 2em 0;
`;

const Dt = styled.dt`
  font-size: 1em;
  margin-bottom: 0.5em;
  font-weight: 200;
  float: left;
  wiDth: 150px;
`;

const Dd = styled.dd`
  margin-bottom: 1em;
  margin-left: 150px;
`;

const Description = () => {
  const { t } = useTranslation();
  return (
    <div>
      {t('yearlySummary.intro')}
      <Dl>
        <Dt>Month</Dt>
        <Dd>{t('yearlySummary.month')}</Dd>
        <Dt>RWY{__CONF__.aerodrome.runways[0].name}</Dt>
        <Dd>{t('yearlySummary.runway', {name: __CONF__.aerodrome.runways[0].name})}</Dd>
        <Dt>RWY{__CONF__.aerodrome.runways[1].name}</Dt>
        <Dd>{t('yearlySummary.runway', {name: __CONF__.aerodrome.runways[1].name})}</Dd>
        <Dt>PrivatePax</Dt>
        <Dd>{t('yearlySummary.privatePax')}</Dd>
        <Dt>PrivateLocal</Dt>
        <Dd>{t('yearlySummary.privateLocal')}</Dd>
        <Dt>PrivateAway</Dt>
        <Dd>{t('yearlySummary.privateAway')}</Dd>
        <Dt>PrivateCircuits</Dt>
        <Dd>{t('yearlySummary.privateCircuits')}</Dd>
        <Dt>InstructionPax</Dt>
        <Dd>{t('yearlySummary.instructionPax')}</Dd>
        <Dt>InstructionLocal</Dt>
        <Dd>{t('yearlySummary.instructionLocal')}</Dd>
        <Dt>InstructionAway</Dt>
        <Dd>{t('yearlySummary.instructionAway')}</Dd>
        <Dt>InstructionCircuits</Dt>
        <Dd>{t('yearlySummary.instructionCircuits')}</Dd>
        <Dt>CommercialPax</Dt>
        <Dd>{t('yearlySummary.commercialPax')}</Dd>
        <Dt>CommercialLocal</Dt>
        <Dd>{t('yearlySummary.commercialLocal')}</Dd>
        <Dt>Helicopter</Dt>
        <Dd>{t('yearlySummary.helicopter')}</Dd>
        <Dt>Total</Dt>
        <Dd>{t('yearlySummary.total')}</Dd>
        <Dt>TotalCircuits</Dt>
        <Dd>{t('yearlySummary.totalCircuits')}</Dd>
      </Dl>
    </div>
  );
};

export default Description;
