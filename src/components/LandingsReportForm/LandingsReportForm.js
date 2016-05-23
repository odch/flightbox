import React from 'react';
import ReportForm from '../ReportForm';
import LabeledBox from '../LabeledBox';
import { landings } from '../../util/report';

const LandingsReportForm = () => (
  <LabeledBox label="Landeliste herunterladen (CSV)">
    <ReportForm generate={landings}/>
  </LabeledBox>
);

export default LandingsReportForm;
