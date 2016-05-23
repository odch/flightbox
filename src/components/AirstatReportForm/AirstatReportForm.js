import React from 'react';
import ReportForm from '../ReportForm';
import LabeledBox from '../LabeledBox';
import { airstat } from '../../util/report';

const AirstatReportForm = () => (
  <LabeledBox label="BAZL-Report herunterladen (CSV)">
    <ReportForm generate={airstat}/>
  </LabeledBox>
);

export default AirstatReportForm;
