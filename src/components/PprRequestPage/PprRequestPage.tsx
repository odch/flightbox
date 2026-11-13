import React from 'react';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import PprRequestForm from '../PprRequestForm';
import JumpNavigation from '../JumpNavigation';

const Content = styled.div`
  padding: 2em;
`;

const PprRequestPage = props => (
  <VerticalHeaderLayout>
    <Content>
      <JumpNavigation/>
      <PprRequestForm
        submitting={props.submitting}
        submitted={props.submitted}
        result={props.result}
        commitFailed={props.commitFailed}
        initialValues={props.initialValues}
        profileAircrafts={props.profileAircrafts}
        initPprForm={props.initPprForm}
        onSubmit={props.submitPprRequest}
        resetPprForm={props.resetPprForm}
        confirmPprSubmitSuccess={props.confirmPprSubmitSuccess}
      />
    </Content>
  </VerticalHeaderLayout>
);

export default PprRequestPage;
