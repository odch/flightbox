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
        submitted={props.submitted}
        commitFailed={props.commitFailed}
        initialValues={props.initialValues}
        initPprForm={props.initPprForm}
        onSubmit={props.submitPprRequest}
        resetPprForm={props.resetPprForm}
        confirmPprSubmitSuccess={props.confirmPprSubmitSuccess}
      />
    </Content>
  </VerticalHeaderLayout>
);

export default PprRequestPage;
