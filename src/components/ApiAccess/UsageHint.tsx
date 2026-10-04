import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import ClipboardCopier from '../ClipboardCopier';
import {scopeLabel} from './scopes';

// On the app's own domain (e.g. lsze.flightbox.aero), like the guest and
// kiosk links: Firebase Hosting forwards /api/** to the functions, and
// external programs should not depend on the function URL.
const apiBaseUrl = () => `${window.location.origin}/api/v1`;

const Paragraph = styled.p`
  margin: 0 0 0.75em 0;
`;

const Heading = styled.h3`
  margin: 1.5em 0 0.5em 0;
  font-size: 1.1em;
`;

const CodeRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  margin-bottom: 1.25em;
`;

const Code = styled.pre`
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0.75em;
  font-family: monospace;
  font-size: 0.9em;
  background-color: #f7f7f7;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;

const DefinitionList = styled.dl`
  margin: 0 0 1.25em 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.4em 1em;

  dt {
    font-family: monospace;
  }

  dd {
    margin: 0;
  }
`;

const CopyableCode = ({text, testId}: { text: string, testId: string }) => (
  <CodeRow>
    <Code data-testid={testId}>{text}</Code>
    <ClipboardCopier text={text}/>
  </CodeRow>
);

const UsageHint = () => {
  const {t} = useTranslation();
  const baseUrl = apiBaseUrl();

  const reportUrl = `${baseUrl}/reports/airstat`;
  const reportCurl = [
    `curl -H "Authorization: Bearer ${t('apiAccess.usage.keyPlaceholder')}" \\`,
    `  "${reportUrl}?year=2026&month=9&internal=false&delimiter=semicolon"`,
  ].join('\n');

  const statusUrl = `${baseUrl}/aerodrome/status`;
  const statusCurl = `curl "${statusUrl}"`;

  return (
    <div>
      <Paragraph>{t('apiAccess.usage.intro')}</Paragraph>
      <CopyableCode text={baseUrl} testId="api-base-url"/>

      <Heading>{scopeLabel(t, 'reports:airstat')}</Heading>
      <Paragraph>{t('apiAccess.usage.airstat.description', {scope: scopeLabel(t, 'reports:airstat')})}</Paragraph>
      <CopyableCode text={reportUrl} testId="api-endpoint"/>
      <Paragraph>{t('apiAccess.usage.parameters')}</Paragraph>
      <DefinitionList>
        <dt>year</dt>
        <dd>{t('apiAccess.usage.year')}</dd>
        <dt>month</dt>
        <dd>{t('apiAccess.usage.month')}</dd>
        <dt>internal</dt>
        <dd>{t('apiAccess.usage.internal', {scope: scopeLabel(t, 'reports:airstat:internal')})}</dd>
        <dt>delimiter</dt>
        <dd>{t('apiAccess.usage.delimiter')}</dd>
      </DefinitionList>
      <Paragraph>{t('apiAccess.usage.example')}</Paragraph>
      <CopyableCode text={reportCurl} testId="api-curl-example"/>

      <Heading>{t('apiAccess.usage.status.title')}</Heading>
      <Paragraph>{t('apiAccess.usage.status.description')}</Paragraph>
      <CopyableCode text={statusUrl} testId="api-status-endpoint"/>
      <Paragraph>{t('apiAccess.usage.example')}</Paragraph>
      <CopyableCode text={statusCurl} testId="api-status-curl-example"/>

      <Heading>{t('apiAccess.usage.errors.title')}</Heading>
      <DefinitionList data-testid="api-errors">
        <dt>400</dt>
        <dd>{t('apiAccess.usage.errors.badRequest')}</dd>
        <dt>401</dt>
        <dd>{t('apiAccess.usage.errors.unauthorized')}</dd>
        <dt>403</dt>
        <dd>{t('apiAccess.usage.errors.forbidden')}</dd>
        <dt>429</dt>
        <dd>{t('apiAccess.usage.errors.rateLimited')}</dd>
        <dt>500</dt>
        <dd>{t('apiAccess.usage.errors.serverError')}</dd>
      </DefinitionList>
    </div>
  );
};

export default UsageHint;
