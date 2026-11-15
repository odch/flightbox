import React from 'react';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import PprRequestForm from '../PprRequestForm';
import JumpNavigation from '../JumpNavigation';

const Content = styled.div`
  padding: 2em;
`;

// Visitors without a login get neither the navigation nor the start page
// behind the logo, which would show them the login: the logo leads to the
// PPR intro instead.
const PprRequestPage = props => (
  <VerticalHeaderLayout homePath={props.visitor ? '/ppr/new' : undefined}>
    <Content>
      {!props.visitor && <JumpNavigation/>}
      <PprRequestForm
        submitting={props.submitting}
        submitted={props.submitted}
        result={props.result}
        commitFailed={props.commitFailed}
        rateLimited={props.rateLimited}
        initialValues={props.initialValues}
        profileAircrafts={props.profileAircrafts}
        initPprForm={props.initPprForm}
        onSubmit={props.onSubmit}
        resetPprForm={props.resetPprForm}
        confirmPprSubmitSuccess={props.confirmPprSubmitSuccess}
        withoutLogin={props.withoutLogin}
        visitor={props.visitor}
        privacyPolicyUrl={props.privacyPolicyUrl}
      />
    </Content>
  </VerticalHeaderLayout>
);

export default PprRequestPage;
