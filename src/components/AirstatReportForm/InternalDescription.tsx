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
  wiDth: 200px;
`;

const Dd = styled.dd`
  margin-bottom: 1em;
  margin-left: 200px;
`;

const InternalDescription = () => {
  const { t } = useTranslation();
  return (
    <div>
      {t('airstatReport.internalDesc')}
      <Dl>
        <Dt>KEY</Dt>
        <Dd>{t('airstatReport.referenceNumber')}</Dd>
        {__CONF__.memberManagement === true && (
          <>
            <Dt>MEMBERNR</Dt>
            <Dd>{t('airstatReport.memberNr')}</Dd>
          </>
        )}
        <Dt>LASTNAME</Dt>
        <Dd>{t('airstatReport.lastname')}</Dd>
        <Dt>EMAIL</Dt>
        <Dd>{t('airstatReport.email')}</Dd>
        <Dt>MTOW</Dt>
        <Dd>{t('airstatReport.mtow')}</Dd>
        <Dt>CLUB</Dt>
        <Dd><em>1</em>, {t('airstatReport.clubAircraft')}</Dd>
        <Dt>HOME_BASE</Dt>
        <Dd><em>1</em>, {t('airstatReport.homeBaseAircraft')}</Dd>
        <Dt>ORIGINAL_ORIDE</Dt>
        <Dd>{t('airstatReport.originalLocation')} <em>LSZZ</em> {t('airstatReport.originalLocationEnd')}</Dd>
        <Dt>REMARKS</Dt>
        <Dd>{t('airstatReport.remarks')}</Dd>
        <Dt>FEES</Dt>
        <Dd>{t('airstatReport.landingFeeTotal')}</Dd>
        <Dt>LDG_COUNT</Dt>
        <Dd>{t('airstatReport.landingCount')}</Dd>
        <Dt>GA_COUNT</Dt>
        <Dd>{t('airstatReport.goAroundCount')}</Dd>
        <Dt>PAYMENT_METHOD</Dt>
        <Dd>{t('airstatReport.paymentMethod')}</Dd>
        <Dt>INVOICE_RECIPIENT</Dt>
        <Dd>{t('airstatReport.invoiceRecipient')}</Dd>
      </Dl>
    </div>
  );
};

export default InternalDescription;
