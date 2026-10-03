import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import ClipboardCopier from '../ClipboardCopier';

const airstatEndpointUrl = () =>
  `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/v1/reports/airstat`;

const Paragraph = styled.p`
  margin: 0 0 0.75em 0;
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

const ParamList = styled.dl`
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

const UsageHint = () => {
  const {t} = useTranslation();
  const endpoint = airstatEndpointUrl();
  const curl = [
    `curl -H "Authorization: Bearer ${t('apiAccess.usage.keyPlaceholder')}" \\`,
    `  "${endpoint}?year=2026&month=9&internal=false&delimiter=semicolon"`,
  ].join('\n');

  return (
    <div>
      <Paragraph>{t('apiAccess.usage.endpoint')}</Paragraph>
      <CodeRow>
        <Code data-testid="api-endpoint">{endpoint}</Code>
        <ClipboardCopier text={endpoint}/>
      </CodeRow>
      <Paragraph>{t('apiAccess.usage.header')}</Paragraph>
      <Paragraph>{t('apiAccess.usage.parameters')}</Paragraph>
      <ParamList>
        <dt>year</dt>
        <dd>{t('apiAccess.usage.year')}</dd>
        <dt>month</dt>
        <dd>{t('apiAccess.usage.month')}</dd>
        <dt>internal</dt>
        <dd>{t('apiAccess.usage.internal')}</dd>
        <dt>delimiter</dt>
        <dd>{t('apiAccess.usage.delimiter')}</dd>
      </ParamList>
      <Paragraph>{t('apiAccess.usage.example')}</Paragraph>
      <CodeRow>
        <Code data-testid="api-curl-example">{curl}</Code>
        <ClipboardCopier text={curl}/>
      </CodeRow>
    </div>
  );
};

export default UsageHint;
