import React from 'react';
import styled from 'styled-components';
import Item from './Item';
import { withTranslation } from 'react-i18next';

const Wrapper = styled.div`
  font-size: 1.2em;
  margin-bottom: 2em;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

class JumpNavigation extends React.PureComponent {
  render() {
    const { t } = this.props;
    return (
      <Wrapper>
        <Item href="/" icon="home" label={t('nav.home')}/>
        <Item href="/departure/new" icon="flight_takeoff" label={t('hints.recordDeparture')}/>
        <Item href="/arrival/new" icon="flight_land" label={t('hints.recordArrival')}/>
      </Wrapper>
    );
  }
}

export default withTranslation()(JumpNavigation);
